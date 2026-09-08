const express = require('express');
const router = express.Router();
const conexao = require('../db'); // Certifique-se de ajustar o caminho da sua conexão MySQL

/* ======================================================
   FUNÇÕES AUXILIARES DE CÁLCULO
====================================================== */

function arredondar(valor) {
    return Math.round((Number(valor) || 0) * 100) / 100;
}

function validarTaxa(taxa) {
    const t = Number(taxa);
    if (isNaN(t) || t <= 0) {
        throw new Error("Taxa de juros inválida.");
    }
    return t;
}

function normalizarTipoJuros(tipo) {
    const t = String(tipo || "").trim().toLowerCase();
    if (t === "dia" || t === "diario" || t === "diária") return "dia";
    if (t === "mes" || t === "mensal") return "mes";
    throw new Error("Tipo de juros inválido. Use 'dia' ou 'mes'.");
}

/* ======================================================
   ROTA PARA LISTAR CONTAS EM ABERTO COM SEUS ITENS
====================================================== */

router.get("/contas-fiado/abertas", async (req, res) => {
    try {
        // Busca todas as contas em aberto com dados do cliente
        const [contas] = await conexao.query(`
            SELECT 
                c.id_conta,
                c.id_cliente,
                c.data_vencimento,
                c.status,
                c.origem,
                cl.nome_completo
            FROM contas_fiado c
            JOIN clientes cl ON cl.id_cliente = c.id_cliente
            WHERE c.status = 'ABERTO'
            ORDER BY cl.nome_completo ASC
        `);

        if (contas.length === 0) {
            return res.json([]);
        }

        const idsContas = contas.map(c => c.id_conta);

        // Busca os produtos vinculados às contas
        const [itens] = await conexao.query(`
            SELECT 
                p.id_conta,
                p.id_produto,
                p.qtd,
                p.valor_unit,
                (p.qtd * p.valor_unit) AS valor_base,
                p.juros_ativo,
                p.tipo_juros,
                p.taxa_juros,
                p.valor_juros_inicio,
                p.data_inicio_juros,
                prod.nome_produto
            FROM conta_fiado_prod p
            JOIN produtos prod ON prod.id_produto = p.id_produto
            WHERE p.id_conta IN (?)
        `, [idsContas]);

        // Mapeia os itens por conta e calcula o valor atualizado
        const mapaItens = new Map();
        const agora = new Date();

        for (const item of itens) {
            const idConta = Number(item.id_conta);
            const valorBase = Number(item.valor_base || 0);
            let valorAtual = valorBase;

            // Cálculo de juros por item se estiver ativo
            if (item.juros_ativo && item.data_inicio_juros) {
                const dataInicio = new Date(item.data_inicio_juros);
                const difTempo = agora - dataInicio;
                const taxa = Number(item.taxa_juros || 0) / 100;

                let periodos = 0;
                if (item.tipo_juros === 'dia') {
                    periodos = Math.floor(difTempo / (1000 * 60 * 60 * 24));
                } else if (item.tipo_juros === 'mes') {
                    periodos = Math.floor(difTempo / (1000 * 60 * 60 * 24 * 30));
                }

                if (periodos > 0) {
                    valorAtual = valorBase * Math.pow(1 + taxa, periodos);
                }
            }

            const itemFormatado = {
                ...item,
                valor_base: arredondar(valorBase),
                valor_atual: arredondar(valorAtual)
            };

            if (!mapaItens.has(idConta)) {
                mapaItens.set(idConta, []);
            }
            mapaItens.get(idConta).push(itemFormatado);
        }

        // Monta a resposta final agrupada por conta
        const resposta = contas.map(conta => {
            const idConta = Number(conta.id_conta);
            const listaItens = mapaItens.get(idConta) || [];

            const valorOriginal = listaItens.reduce((soma, i) => soma + Number(i.valor_base || 0), 0);
            const valorAtualTotal = listaItens.reduce((soma, i) => soma + Number(i.valor_atual || 0), 0);
            const jurosAtual = Math.max(0, valorAtualTotal - valorOriginal);
            const possuiJuros = listaItens.some(i => Number(i.juros_ativo) === 1);

            return {
                id_conta: conta.id_conta,
                id_cliente: conta.id_cliente,
                nome_completo: conta.nome_completo,
                valor_original: arredondar(valorOriginal),
                valor_final: arredondar(valorAtualTotal),
                juros_atual: arredondar(jurosAtual),
                juros_aplicado: possuiJuros,
                data_vencimento: conta.data_vencimento,
                status: conta.status,
                origem: conta.origem,
                quantidade_total: listaItens.reduce((s, i) => s + Number(i.qtd || 0), 0),
                itens: listaItens
            };
        });

        res.json(resposta);

    } catch (err) {
        console.error("Erro ao listar contas:", err);
        res.status(500).json({ erro: err.message });
    }
});

/* ======================================================
   ROTA PARA APLICAR JUROS EM PRODUTOS SELECIONADOS
====================================================== */

router.put("/contas-fiado/juros/aplicar", async (req, res) => {
    const { cliente, tipo_juros, taxa_juros, itens } = req.body;

    if (!cliente || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ erro: "Dados inválidos para aplicação de juros." });
    }

    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const taxa = validarTaxa(taxa_juros);
        const tipo = normalizarTipoJuros(tipo_juros);

        for (const item of itens) {
            const idConta = Number(item.id_conta);
            const idProduto = Number(item.id_produto);

            // Busca dados do produto na conta para salvar o valor base inicial
            const [prodBanco] = await conn.query(
                `SELECT qtd, valor_unit FROM conta_fiado_prod WHERE id_conta = ? AND id_produto = ?`,
                [idConta, idProduto]
            );

            if (prodBanco.length > 0) {
                const valorBase = Number(prodBanco[0].qtd) * Number(prodBanco[0].valor_unit);

                // Atualiza a flag de juros no item do fiado
                await conn.query(
                    `UPDATE conta_fiado_prod
                     SET juros_ativo = TRUE,
                         tipo_juros = ?,
                         taxa_juros = ?,
                         valor_juros_inicio = ?,
                         data_inicio_juros = NOW()
                     WHERE id_conta = ? AND id_produto = ?`,
                    [tipo, taxa, valorBase, idConta, idProduto]
                );

                // Marca na tabela principal que a conta possui juros ativado
                await conn.query(
                    `UPDATE contas_fiado SET juros_aplicado = TRUE WHERE id_conta = ?`,
                    [idConta]
                );
            }
        }

        await conn.commit();
        res.json({ sucesso: true, mensagem: "Juros aplicados aos produtos com sucesso!" });

    } catch (err) {
        await conn.rollback();
        console.error("Erro ao aplicar juros:", err);
        res.status(500).json({ erro: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
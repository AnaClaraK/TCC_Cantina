console.log("PEDIDOS ROUTES CARREGADO");
const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');

const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";
// ==================== PRÓXIMO NÚMERO DO PEDIDO ====================
// Prévia usada pelo PDV antes da finalização.
// NÃO cria pedido no banco.
router.get("/pedidos/proximo-numero", verificarToken, async (req, res) => {
    try {
        const [resultado] = await conexao.query(
            `
            SELECT
                COALESCE(MAX(num_pedido), 0) AS ultimoNumero
            FROM pedidos
            `
        );

        const proximo_numero =
            Number(resultado[0]?.ultimoNumero || 0) + 1;

        console.log(
            "PRÓXIMO NÚMERO DO PEDIDO:",
            proximo_numero
        );

        return res.json({
            sucesso: true,
            num_pedido: proximo_numero,
            proximo_numero
        });

    } catch (erro) {

        console.error(
            "Erro ao buscar próximo número do pedido:",
            erro
        );

        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível obter o próximo número do pedido."
        });
    }
});

// ==================== PDV: ROTA DE PEDIDOS ====================
router.post("/pedidos", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        console.log("====================================");
        console.log("BODY PEDIDO:", req.body);
        console.log("ORIGEM:", req.body.origem);
        console.log("ID COMANDA:", req.body.id_pedido);
        console.log("====================================");

        const {
            id_pedido,       // usado quando o PDV está finalizando uma comanda
            id_user,
            valor_total,
            qtd_total,
            form_pag,
            origem,
            itens
        } = req.body;

        const idCliente = id_user || 1;
        const status = "Finalizado";
        const data = new Date();
        const alertas = [];

        /*
        ============================================================
        CASO 1:
        É uma comanda criada pelo aplicativo.

        Nesse caso NÃO criamos outro pedido.
        Apenas atualizamos o pedido que já existe.
        ============================================================
        */

        if (id_pedido) {

            console.log("FINALIZANDO COMANDA EXISTENTE:", id_pedido);

            // Verifica se a comanda existe
            const [comandas] = await conn.query(
                `SELECT id_pedido, num_pedido, codigo_comanda, status, origem
                 FROM pedidos
                 WHERE id_pedido = ?`,
                [id_pedido]
            );

            if (comandas.length === 0) {
                throw new Error("Comanda não encontrada.");
            }

            const comanda = comandas[0];

            console.log("COMANDA ENCONTRADA:", comanda);

            /*
            ------------------------------------------------------------
            Verifica se já foi finalizada para evitar baixar estoque
            duas vezes.
            ------------------------------------------------------------
            */

            if (comanda.status === "Finalizado") {
                throw new Error("Esta comanda já foi finalizada.");
            }

            /*
            ------------------------------------------------------------
            Busca os itens que JÁ pertencem à comanda.

            Não inserimos novamente em pedidos_itens.
            ------------------------------------------------------------
            */

            const [itensComanda] = await conn.query(
                `SELECT
                    pi.id_produto,
                    pi.qtd,
                    pi.preco_unitario,
                    p.nome,
                    p.qtd AS estoque,
                    p.qtd_min
                 FROM pedidos_itens pi
                 INNER JOIN produtos p
                    ON p.id_produto = pi.id_produto
                 WHERE pi.id_pedido = ?`,
                [id_pedido]
            );

            if (itensComanda.length === 0) {
                throw new Error("A comanda não possui itens.");
            }

            /*
            ------------------------------------------------------------
            Baixa o estoque agora, no momento em que o PDV finaliza.
            ------------------------------------------------------------
            */

            for (const item of itensComanda) {

                const novaQtd = Number(item.estoque) - Number(item.qtd);

                if (novaQtd < 0) {
                    throw new Error(
                        `Estoque insuficiente para: ${item.nome}`
                    );
                }

                if (novaQtd <= Number(item.qtd_min || 0)) {
                    alertas.push(
                        `O produto "${item.nome}" atingiu o estoque mínimo (${novaQtd} restantes).`
                    );
                }

                await conn.query(
                    `UPDATE produtos
                     SET qtd = ?
                     WHERE id_produto = ?`,
                    [novaQtd, item.id_produto]
                );
            }

            /*
            ------------------------------------------------------------
            ATUALIZA A MESMA COMANDA.
            
            IMPORTANTE:
            Não muda:
              - id_pedido
              - num_pedido
              - codigo_comanda
              - origem

            Só finaliza.
            ------------------------------------------------------------
            */

            await conn.query(
                `UPDATE pedidos
                 SET
                    status = ?,
                    valor_total = ?,
                    qtd_total = ?,
                    form_pag = ?,
                    data = ?
                 WHERE id_pedido = ?`,
                [
                    status,
                    valor_total,
                    qtd_total,
                    form_pag,
                    data,
                    id_pedido
                ]
            );

            await conn.commit();

            console.log("COMANDA FINALIZADA COM SUCESSO");
            console.log("ID PEDIDO:", comanda.id_pedido);
            console.log("NÚMERO PEDIDO:", comanda.num_pedido);
            console.log("CÓDIGO COMANDA:", comanda.codigo_comanda);

            return res.status(200).json({
                resposta: "Comanda finalizada com sucesso!",
                id_pedido: comanda.id_pedido,
                num_pedido: comanda.num_pedido,
                codigo_comanda: comanda.codigo_comanda,
                origem: comanda.origem,
                alertas
            });
        }

        /*
        ============================================================
        CASO 2:
        Venda normal feita diretamente pelo PDV.

        Aqui SIM criamos um novo pedido.
        ============================================================
        */

        console.log("CRIANDO NOVO PEDIDO NORMAL DO PDV");

        const [ultimoPedido] = await conn.query(
            `SELECT MAX(num_pedido) AS ultimoNumero
             FROM pedidos`
        );

        const num_pedido =
            (ultimoPedido[0].ultimoNumero || 0) + 1;

        /*
        NÃO coloque id_pedido no INSERT.
        O banco cria automaticamente.
        */

        const [resultadoPedido] = await conn.query(
            `INSERT INTO pedidos (
                id_user,
                num_pedido,
                data,
                status,
                origem,
                valor_total,
                qtd_total,
                form_pag
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                idCliente,
                num_pedido,
                data,
                status,
                origem || "PDV",
                valor_total,
                qtd_total,
                form_pag
            ]
        );

        const novoIdPedido = resultadoPedido.insertId;

        console.log("NOVO PEDIDO CRIADO:", novoIdPedido);
        console.log("NÚMERO:", num_pedido);

        /*
        ------------------------------------------------------------
        Insere os produtos e baixa o estoque.
        ------------------------------------------------------------
        */

        if (itens && itens.length > 0) {

            for (const item of itens) {

                const [estoque] = await conn.query(
                    `SELECT nome, qtd, qtd_min
                     FROM produtos
                     WHERE id_produto = ?`,
                    [item.id_produto]
                );

                if (estoque.length === 0) {
                    throw new Error(
                        `Produto não encontrado: ${item.id_produto}`
                    );
                }

                const produtoDB = estoque[0];

                const novaQtd =
                    Number(produtoDB.qtd) - Number(item.qtd);

                if (novaQtd < 0) {
                    throw new Error(
                        `Estoque insuficiente para: ${produtoDB.nome}`
                    );
                }

                if (novaQtd <= Number(produtoDB.qtd_min || 0)) {
                    alertas.push(
                        `O produto "${produtoDB.nome}" atingiu o estoque mínimo (${novaQtd} restantes).`
                    );
                }

                await conn.query(
                    `UPDATE produtos
                     SET qtd = ?
                     WHERE id_produto = ?`,
                    [
                        novaQtd,
                        item.id_produto
                    ]
                );

                await conn.query(
                    `INSERT INTO pedidos_itens (
                        id_pedido,
                        id_produto,
                        qtd,
                        preco_unitario
                    )
                    VALUES (?, ?, ?, ?)`,
                    [
                        novoIdPedido,
                        item.id_produto,
                        item.qtd,
                        item.preco_unitario ?? item.preco
                    ]
                );
            }
        }

        await conn.commit();

        return res.status(201).json({
            resposta: "Pedido finalizado com sucesso!",
            id_pedido: novoIdPedido,
            num_pedido,
            alertas
        });

    } catch (erro) {

        await conn.rollback();

        console.error("====================================");
        console.error("ERRO AO SALVAR PEDIDO:", erro);
        console.error("====================================");

        return res.status(500).json({
            resposta: erro.message || "Erro ao salvar pedido."
        });

    } finally {
        conn.release();
    }
});
// ==================== HISTÓRICO DE PEDIDOS ====================
// ==================== HISTÓRICO DE PEDIDOS ====================
router.get("/historico-pedidos", verificarToken, async (req, res) => {
    try {
        const apenasMeus = req.query.apenas_meus === 'true';
        const idUserLogado = req.user?.id_user || req.user?.id;

        let queryPedidos = `
            SELECT 
                p.id_pedido,
                p.num_pedido,
                p.codigo_comanda,
                p.id_user,
                p.data,
                p.data_ag,
                p.status,
                p.origem,
                p.valor_total,
                p.form_pag,
                COALESCE(u.nome, 'Consumidor Final') AS nome
            FROM pedidos p
            LEFT JOIN users u ON p.id_user = u.id_user
        `;

        const params = [];

        if (apenasMeus && idUserLogado) {
            queryPedidos += ` WHERE p.id_user = ?`;
            params.push(idUserLogado);
        }

        queryPedidos += ` ORDER BY p.data DESC`;

        const [pedidos] = await conexao.execute(queryPedidos, params);

        if (!pedidos || pedidos.length === 0) {
            return res.json([]);
        }

        const idsPedidos = pedidos.map(p => p.id_pedido);
        const placeholders = idsPedidos.map(() => '?').join(',');

        const queryItens = `
            SELECT 
                pi.id_pedido,
                pi.id_produto,
                pi.qtd,
                pi.preco_unitario,
                COALESCE(prod.nome, 'Produto Indisponível') AS nome
            FROM pedidos_itens pi
            LEFT JOIN produtos prod ON pi.id_produto = prod.id_produto
            WHERE pi.id_pedido IN (${placeholders})
        `;

       const [itens] = await conexao.execute(queryItens, idsPedidos);

console.log("PEDIDOS:", pedidos.length);
console.log(pedidos);

console.log("ITENS:", itens.length);
console.log(itens);

const resultadoFinal = pedidos.map(pedido => {
    const itensDoPedido = itens.filter(
        item => String(item.id_pedido) === String(pedido.id_pedido)
    );

    return {
        ...pedido,
        itens: itensDoPedido
    };
});

console.log("RESULTADO:");
console.log(JSON.stringify(resultadoFinal, null, 2));

return res.json(resultadoFinal);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return res.status(500).json({ erro: "Erro ao processar consulta no banco." });
    }
});
// ==================== LIMPAR/BACKUP HISTÓRICO DE PEDIDOS ====================
router.delete("/historico-pedidos/limpar", verificarToken, async (req, res) => {
    let conn;
    try {
        conn = await conexao.getConnection();
        await conn.beginTransaction();

        // 1. Remove os itens dos pedidos das tabelas filhas (integridade referencial)
        await conn.execute("DELETE FROM pedidos_itens");

        // 2. Remove os registros de pedidos
        await conn.execute("DELETE FROM pedidos");

        await conn.commit();

        return res.json({
            sucesso: true,
            mensagem: "Histórico de pedidos e itens limpos com sucesso!"
        });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Erro ao limpar histórico no banco:", error);
        return res.status(500).json({ erro: "Falha ao apagar o histórico no banco de dados." });
    } finally {
        if (conn) conn.release();
    }
});
// ==================== ROTA DE COMANDAS ====================
router.post("/comandas", async (req, res) => {
    const { 
        id_user, 
        carrinho, 
        valor_total, 
        qtd_total, 
        status, 
        forma_pagamento, 
        form_pag 
    } = req.body;

    const pagamentoSelecionado = forma_pagamento || form_pag;

    if (!id_user || !carrinho || carrinho.length === 0) {
        return res.status(400).json({
            sucesso: false,
            erro: "Dados incompletos ou carrinho vazio."
        });
    }

    if (!pagamentoSelecionado) {
        return res.status(400).json({
            sucesso: false,
            erro: "Forma de pagamento não informada."
        });
    }

    let conn;

    try {
        conn = await conexao.getConnection();
        await conn.beginTransaction();

        const primeiroItem = carrinho[0];
        let dataAgFormatada = null;

        if (primeiroItem?.data_agendamento && primeiroItem?.horario_retirada) {
            dataAgFormatada = `${primeiroItem.data_agendamento} ${primeiroItem.horario_retirada}:00`;
        } else if (primeiroItem?.data_agendamento) {
            dataAgFormatada = `${primeiroItem.data_agendamento} 00:00:00`;
        }

        const [ultimoPedido] = await conn.execute(
            "SELECT MAX(num_pedido) as max_num FROM pedidos"
        );

        const proximoNumero = (ultimoPedido[0].max_num || 0) + 1;
        const codigo_comanda = `CMD${proximoNumero}`;

        const queryPedido = `
            INSERT INTO pedidos (
                id_user,
                num_pedido,
                codigo_comanda,
                data,
                data_ag,
                status,
                origem,
                valor_total,
                qtd_total,
                form_pag
            )
            VALUES (?, ?, ?, NOW(), ?, ?, 'APP', ?, ?, ?)
        `;

        const [resultadoPedido] = await conn.execute(queryPedido, [
            id_user,
            proximoNumero,
            codigo_comanda,
            dataAgFormatada,
            status || "Pendente",
            valor_total,
            qtd_total,
            pagamentoSelecionado
        ]);

        const idPedidoGerado = resultadoPedido.insertId;

        const queryItem = `
            INSERT INTO pedidos_itens (
                id_pedido,
                id_produto,
                qtd,
                preco_unitario
            )
            VALUES (?, ?, ?, ?)
        `;

        for (const item of carrinho) {
            await conn.execute(queryItem, [
                idPedidoGerado,
                item.id_produto || item.id,
                item.qtd,
                item.preco_unitario || item.preco
            ]);
        }

        await conn.commit();

        return res.json({
            sucesso: true,
            mensagem: "Comanda criada com sucesso",
            id_pedido: idPedidoGerado,
            num_pedido: proximoNumero,
            codigo_comanda
        });

    } catch (error) {
        if (conn) {
            await conn.rollback();
        }
        console.error("Erro ao criar comanda:", error);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro interno ao criar comanda"
        });

    } finally {
        if (conn) {
            conn.release();
        }
    }
});
// ==================== BUSCAR COMANDA PELO CÓDIGO ====================
router.get("/comandas/:codigo", async (req, res) => {
    const { codigo } = req.params;

    let conn;

    try {
        conn = await conexao.getConnection();

        console.log("Buscando comanda pelo código:", codigo);

        // 1. Busca a comanda no banco
        const [pedidos] = await conn.execute(
            `
            SELECT
                id_pedido,
                num_pedido,
                codigo_comanda,
                status,
                origem,
                form_pag
            FROM pedidos
            WHERE codigo_comanda = ?
            AND UPPER(origem) = 'APP'
            `,
            [codigo]
        );

        console.log("Resultado retornado do BD:", pedidos);

        if (!pedidos || pedidos.length === 0) {
            return res.status(404).json({
                sucesso: false,
                erro: "Comanda não encontrada."
            });
        }

        const pedido = pedidos[0];

        // BLOQUEIA COMANDA JÁ FINALIZADA
        if (pedido.status === "Finalizado") {
            return res.status(400).json({
                sucesso: false,
                erro: "Esta comanda já foi finalizada e não pode mais ser aberta."
            });
        }

        const idPedido = pedido.id_pedido;
        // 3. Busca os itens da comanda
        const [itens] = await conn.execute(
            `
            SELECT
                pi.id_produto,
                pi.qtd,
                pi.preco_unitario AS preco,
                p.codigo_barras,
                p.nome,
                p.qtd AS estoque,
                p.qtd_min,
                p.img
            FROM pedidos_itens pi
            INNER JOIN produtos p
                ON p.id_produto = pi.id_produto
            WHERE pi.id_pedido = ?
            `,
            [idPedido]
        );

        console.log("Forma de pagamento da comanda:", pedido.form_pag);

        // 4. Retorna a comanda completa
        return res.json({
            id_pedido: pedido.id_pedido,
            num_pedido: pedido.num_pedido,
            codigo_comanda: pedido.codigo_comanda,
            status: pedido.status,
            origem: pedido.origem,

            // IMPORTANTE:
            // forma de pagamento que veio do APP
            form_pag: pedido.form_pag,

            carrinho: itens
        });

    } catch (erro) {
        console.error("Erro ao buscar comanda:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro interno."
        });

    } finally {
        if (conn) {
            conn.release();
        }
    }
});
module.exports = router;
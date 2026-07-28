const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');

const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";

// ==================== PDV: ROTA DE PEDIDOS ====================
router.post("/pedidos", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        await conn.beginTransaction();

        const { id_user, valor_total, qtd_total, form_pag, origem, itens } = req.body;
        const idCliente = id_user || 1;
        const status = "Finalizado";
        const data = new Date();
        const alertas = []; 

        const [ultimoPedido] = await conn.query(`SELECT MAX(num_pedido) AS ultimoNumero FROM pedidos`);
        const num_pedido = (ultimoPedido[0].ultimoNumero || 0) + 1;

        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (id_user, num_pedido, data, status, origem, valor_total, qtd_total, form_pag) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [idCliente, num_pedido, data, status, origem, valor_total, qtd_total, form_pag]);

        const id_pedido = resultadoPedido.insertId;

        if (itens && itens.length > 0) {
            for (const item of itens) {
                const [estoque] = await conn.query(
                    "SELECT nome, qtd, qtd_min FROM produtos WHERE id_produto = ?", 
                    [item.id_produto]
                );

                const produtoDB = estoque[0];
                const novaQtd = produtoDB.qtd - item.qtd;

                if (novaQtd < 0) {
                    throw new Error(`Estoque insuficiente para: ${produtoDB.nome}`);
                }

                if (novaQtd <= produtoDB.qtd_min) {
                    alertas.push(`O produto "${produtoDB.nome}" atingiu o estoque mínimo (${novaQtd} restantes).`);
                }

                await conn.query("UPDATE produtos SET qtd = ? WHERE id_produto = ?", [novaQtd, item.id_produto]);

                await conn.query(`
                    INSERT INTO pedidos_itens (id_pedido, id_produto, qtd, preco_unitario, origem) 
                    VALUES (?, ?, ?, ?, ?)
                `, [id_pedido, item.id_produto, item.qtd, item.preco_unitario ?? item.preco, item.origem]);
            }
        }

        await conn.commit();

        res.status(201).json({
            resposta: "Pedido finalizado com sucesso!",
            id_pedido,
            num_pedido,
            alertas
        });

    } catch (erro) {
        await conn.rollback();
        console.error("Erro ao salvar pedido:", erro);
        res.status(500).json({ resposta: erro.message || "Erro ao salvar pedido." });
    } finally {
        conn.release();
    }
});

// ==================== HISTÓRICO DE PEDIDOS ====================
router.get("/historico-pedidos", verificarToken, async (req, res) => {
    try {
        const idUserLogado = req.user?.id_user || req.user?.id || req.query.id_user;

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
        if (idUserLogado) {
            queryPedidos += ` WHERE p.id_user = ?`;
            params.push(idUserLogado);
        }

        queryPedidos += ` ORDER BY p.data DESC`;

        const [pedidos] = await conexao.execute(queryPedidos, params);

        if (!pedidos || pedidos.length === 0) {
            return res.json([]);
        }

        // Extrai os IDs dos pedidos
        const idsPedidos = pedidos.map(p => p.id_pedido);
        const placeholders = idsPedidos.map(() => '?').join(',');

        // Busca TODOS os itens vinculados a esses pedidos
        const queryItens = `
            SELECT 
                pi.id_pedido,
                pi.id_produto,
                pi.qtd,
                pi.preco_unitario,
                COALESCE(prod.nome, 'Produto Indisponível') AS nome_produto
            FROM pedidos_itens pi
            LEFT JOIN produtos prod ON pi.id_produto = prod.id_produto
            WHERE pi.id_pedido IN (${placeholders})
        `;

        const [itens] = await conexao.execute(queryItens, idsPedidos);

        // LOG DE DEPURACÃO NO TERMINAL DO NODE:
        console.log("--> ITENS ENCONTRADOS NO BANCO:", itens);

        // Agrupa os itens garantindo a comparação correta (String com String)
        const resultadoFinal = pedidos.map(pedido => {
            const itensDoPedido = itens.filter(
                item => String(item.id_pedido) === String(pedido.id_pedido)
            );

            return {
                ...pedido,
                itens: itensDoPedido // Garante que é um array simples de objetos [{...}]
            };
        });

        return res.json(resultadoFinal);

    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        return res.status(500).json({ erro: "Erro ao processar consulta no banco." });
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
            VALUES (?, ?, ?, NOW(), ?, ?, 'App', ?, ?, ?)
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

module.exports = router;
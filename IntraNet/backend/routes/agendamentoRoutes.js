
const express =
require('express');

const router =
express.Router();

const conexao =
require('../db');

const verificarToken =
require('../middlewares/auth');
//--- agendamento
router.post("/agendamento", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const {
            id_user,
            data,
            data_ag,
            valor_total,
            qtd_total,
            form_pag,
            itens
        } = req.body;

        const status = "Agendado";

        const [ultimoPedido] = await conn.query(`
            SELECT COALESCE(MAX(num_pedido),0) AS ultimoNumero
            FROM pedidos
        `);

        const num_pedido = ultimoPedido[0].ultimoNumero + 1;

        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (
                id_user,
                num_pedido,
                data,
                data_ag,
                status,
                valor_total,
                qtd_total,
                form_pag
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_user,
            num_pedido,
            data,
            data_ag,
            status,
            valor_total,
            qtd_total,
            form_pag
        ]);

        const id_pedido = resultadoPedido.insertId;

        if (itens && itens.length > 0) {
            for (const item of itens) {

                // 🔒 valida estoque disponível (sem baixar)
                const [produto] = await conn.query(
                    "SELECT qtd FROM produtos WHERE id_produto = ?",
                    [item.id_produto]
                );

                const [reservado] = await conn.query(`
                    SELECT COALESCE(SUM(i.qtd),0) AS total
                    FROM pedidos_itens i
                    JOIN pedidos p ON p.id_pedido = i.id_pedido
                    WHERE i.id_produto = ?
                    AND p.status = 'Agendado'
                `, [item.id_produto]);

                const disponivel = produto[0].qtd - reservado[0].total;

                if (item.qtd > disponivel) {
                    throw new Error(`Sem estoque suficiente para agendamento`);
                }

                await conn.query(`
                    INSERT INTO pedidos_itens (
                        id_pedido,
                        id_produto,
                        qtd,
                        preco_unitario
                    ) VALUES (?, ?, ?, ?)
                `, [
                    id_pedido,
                    item.id_produto,
                    item.qtd,
                    item.preco
                ]);
            }
        }

        await conn.commit();

        res.json({
            resposta: "Agendamento criado com sucesso",
            id_pedido,
            num_pedido
        });

    } catch (erro) {
        await conn.rollback();
        res.status(500).json({ erro: erro.message });

    } finally {
        conn.release();
    }
});

//--- agendamento finalizar
router.put("/agendamento/:id/finalizar", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const id = req.params.id;

        // pega itens do pedido
        const [itens] = await conn.query(`
            SELECT id_produto, qtd
            FROM pedidos_itens
            WHERE id_pedido = ?
        `, [id]);

        for (const item of itens) {
            await conn.query(`
                UPDATE produtos
                SET qtd = qtd - ?
                WHERE id_produto = ?
            `, [item.qtd, item.id_produto]);
        }

        await conn.query(`
            UPDATE pedidos
            SET status = 'Finalizado'
            WHERE id_pedido = ?
        `, [id]);

        await conn.commit();

        res.json({ mensagem: "Agendamento finalizado e estoque baixado" });

    } catch (erro) {
        await conn.rollback();
        res.status(500).json({ erro: "Erro ao finalizar agendamento" });
    } finally {
        conn.release();
    }
});
//-- cancelar agendamento
router.put("/agendamento/:id/cancelar", verificarToken, async (req, res) => {
    try {
        const id = req.params.id;

        const [result] = await conexao.query(`
            UPDATE pedidos
            SET status = 'Cancelado'
            WHERE id_pedido = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                erro: "Agendamento não encontrado"
            });
        }

        res.json({
            mensagem: "Agendamento cancelado com sucesso"
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cancelar agendamento"
        });
    }
});

//---
//--- Listar agendamentos
router.get("/agendamento", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                p.id_pedido,
                p.num_pedido,
                p.data,
                p.data_ag,
                p.valor_total,
                p.qtd_total,
                p.form_pag,
                p.status,
                p.origem,
                u.nome AS cliente_nome,
                i.id_produto,
                pr.nome AS produto_nome,
                i.qtd,
                i.preco_unitario
            FROM pedidos p
            LEFT JOIN users u ON p.id_user = u.id_user
            LEFT JOIN pedidos_itens i ON p.id_pedido = i.id_pedido
            LEFT JOIN produtos pr ON i.id_produto = pr.id_produto
            WHERE p.status = 'Agendado'
            ORDER BY p.data DESC
        `);

        const pedidosMap = {};

        rows.forEach(r => {
            if (!pedidosMap[r.id_pedido]) {
                pedidosMap[r.id_pedido] = {
                    id_pedido: r.id_pedido,
                    num_pedido: r.num_pedido,
                    data: r.data,
                    data_ag: r.data_ag,
                    valor_total: r.valor_total,
                    qtd_total: r.qtd_total,
                    form_pag: r.form_pag,
                    status: r.status,
                    origem: r.origem,
                    cliente_nome: r.cliente_nome,
                    produtos: []
                };
            }

            if (r.id_produto) {
                pedidosMap[r.id_pedido].produtos.push({
                    id_produto: r.id_produto,
                    nome: r.produto_nome,
                    qtd: r.qtd,
                    preco: r.preco_unitario
                });
            }
        });

        res.json(Object.values(pedidosMap));

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Erro ao buscar agendamentos" });
    }
});
module.exports = router;
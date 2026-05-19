
const express =
require('express');

const router =
express.Router();

const conexao =
require('../db');

const verificarToken =
require('../middlewares/auth');
const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";
//--PDV rota pedidos
router.post("/pedidos", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        await conn.beginTransaction();

        const { id_user, valor_total, qtd_total, form_pag, origem, itens } = req.body;
        const idCliente = id_user || 1;
        const status = "Finalizado";
        const data = new Date();
        const alertas = []; // Array para armazenar os avisos de estoque baixo

        const [ultimoPedido] = await conn.query(`SELECT MAX(num_pedido) AS ultimoNumero FROM pedidos`);
        const num_pedido = (ultimoPedido[0].ultimoNumero || 0) + 1;

        const [resultadoPedido] = await conn.query(`
            INSERT INTO pedidos (id_user, num_pedido, data, status, origem, valor_total, qtd_total, form_pag) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [idCliente, num_pedido, data, status, origem, valor_total, qtd_total, form_pag]);

        const id_pedido = resultadoPedido.insertId;

        if (itens && itens.length > 0) {
            for (const item of itens) {
                // BUSCA ESTOQUE ATUAL E QTD MÍNIMA
                const [estoque] = await conn.query(
                    "SELECT nome, qtd, qtd_min FROM produtos WHERE id_produto = ?", 
                    [item.id_produto]
                );

                const produtoDB = estoque[0];
                const novaQtd = produtoDB.qtd - item.qtd;

                // 1. Bloqueio de segurança (Não deixa vender o que não tem)
                if (novaQtd < 0) {
                    throw new Error(`Estoque insuficiente para: ${produtoDB.nome}`);
                }

                // 2. VERIFICAÇÃO DE ESTOQUE MÍNIMO (O AVISO)
                if (novaQtd <= produtoDB.qtd_min) {
                    alertas.push(`O produto "${produtoDB.nome}" atingiu o estoque mínimo (${novaQtd} restantes).`);
                }

                // Atualiza o estoque no banco
                await conn.query("UPDATE produtos SET qtd = ? WHERE id_produto = ?", [novaQtd, item.id_produto]);

                // Salva o item do pedido
                await conn.query(`
                    INSERT INTO pedidos_itens (id_pedido, id_produto, qtd, preco_unitario, origem) 
                    VALUES (?, ?, ?, ?, ?)
                `, [id_pedido, item.id_produto, item.qtd, item.origem, item.preco_unitario ?? item.preco]);
            }
        }

        await conn.commit();

        res.status(201).json({
            resposta: "Pedido finalizado com sucesso!",
            id_pedido,
            num_pedido,
            alertas: alertas // Envia a lista de avisos para o frontend
        });

    } catch (erro) {
        await conn.rollback();
        console.error("Erro ao salvar pedido:", erro);
        res.status(500).json({ resposta: erro.message || "Erro ao salvar pedido." });
    } finally {
        conn.release();
    }
});
//---- Histórico Pedidos

router.get("/historico-pedidos", verificarToken, async (req, res) => {
    try {
        const [pedidos] = await conexao.query(`
            SELECT
                p.id_pedido,
                p.num_pedido,
                p.data,
                p.valor_total,
                p.form_pag,
                p.status,
                p.origem,
                u.nome
            FROM pedidos p
            LEFT JOIN users u ON p.id_user = u.id_user
            WHERE p.status = 'Finalizado'
            ORDER BY p.data DESC
        `);

        res.json(pedidos);
    } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);
        res.status(500).json({
            erro: "Erro ao buscar histórico de pedidos"
        });
    }
});
module.exports = router;
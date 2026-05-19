
const express =
require('express');

const router =
express.Router();

const conexao =
require('../db');

const verificarToken =
require('../middlewares/auth');
// LISTAR PRODUTOS PARA REPOSIÇÃO (Protegido)
router.get("/reposicao/produtos", verificarToken, async (req, res) => {
    try {
        const termo = (req.query.q || "").trim();

        let sql = `
            SELECT 
                id_produto,
                nome,
                codigo_barras,
                qtd,
                preco,
                img
            FROM produtos
        `;

        let params = [];

        if (termo !== "") {
            sql += `
                WHERE nome LIKE ?
                   OR codigo_barras LIKE ?
            `;
            params = [`%${termo}%`, `${termo}%`];
        }

        sql += `
            ORDER BY nome ASC
            LIMIT 10
        `;

        const [produtos] = await conexao.query(sql, params);

        return res.json(produtos);

    } catch (erro) {
        console.error("Erro ao buscar produtos para reposição:", erro);
        return res.status(500).json({
            erro: "Erro ao buscar produtos."
        });
    }
});

// --- ROTA DE REPOSIÇÃO: Atualiza estoque e registra na tabela 'reposicao' ---
router.put("/reposicao/:codigo", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const codigoBarras = req.params.codigo;
        const { quantidade, local, prioridade } = req.body;

        const [produto] = await conn.query(
            "SELECT id_produto, nome FROM produtos WHERE codigo_barras = ?",
            [codigoBarras]
        );

        if (produto.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        const { id_produto, nome } = produto[0];

        await conn.query(`
            INSERT INTO reposicao (
                id_produto,
                produto,
                qtd_prevista,
                qtd_comprada,
                prioridade,
                local,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id_produto,
            nome,
            quantidade,
            0,
            prioridade,
            local,
            "Pendente"
        ]);

        await conn.commit();

        res.json({
            mensagem: "Reposição adicionada!"
        });

    } catch (erro) {

        await conn.rollback();

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao criar reposição."
        });

    } finally {
        conn.release();
    }
});

//--- get reposição
router.get("/reposicao", verificarToken, async (req, res) => {
    try {

        const [rows] = await conexao.query(`
            SELECT
                r.produto AS nome,
                r.qtd_prevista AS quantidade_prevista,
                r.qtd_comprada AS quantidade_comprada,
                r.prioridade,
                r.local,
                p.codigo_barras AS codigo,
                r.status
            FROM reposicao r
            JOIN produtos p
                ON p.id_produto = r.id_produto
            WHERE r.status = 'Pendente'
            ORDER BY r.id_produto DESC
        `);

        res.json(rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao buscar reposição"
        });

    }
});
//------Reposição concluir
router.put("/reposicao/:codigo/concluir", verificarToken, async (req, res) => {

    try {

        const codigo = req.params.codigo;

        const {
            quantidade_comprada,
            local
        } = req.body;

        const [produto] = await conexao.query(
            "SELECT id_produto FROM produtos WHERE codigo_barras = ?",
            [codigo]
        );

        if (produto.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        const id_produto = produto[0].id_produto;

        await conexao.query(
            `
            UPDATE produtos
            SET qtd = qtd + ?
            WHERE id_produto = ?
            `,
            [quantidade_comprada, id_produto]
        );

        await conexao.query(
            `
            UPDATE reposicao
            SET
                qtd_comprada = ?,
                local = ?,
                status = 'Concluído'
            WHERE
                id_produto = ?
                AND status = 'Pendente'
            `,
            [
                quantidade_comprada,
                local,
                id_produto
            ]
        );

        res.json({
            mensagem: "Reposição concluída"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao concluir reposição"
        });
    }
});
//----Reposição Cancelar
router.put("/reposicao/:codigo/cancelar", verificarToken, async (req, res) => {

    try {

        const codigo = req.params.codigo;

        const [produto] = await conexao.query(
            "SELECT id_produto FROM produtos WHERE codigo_barras = ?",
            [codigo]
        );

        if (produto.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        await conexao.query(`
            UPDATE reposicao
            SET status = 'Cancelado'
            WHERE id_produto = ?
            AND status = 'Pendente'
        `, [produto[0].id_produto]);

        res.json({
            mensagem: "Reposição cancelada"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cancelar reposição"
        });
    }
});
//-- Limpar lista reposição 
router.put("/reposicao/cancelar/todos", verificarToken, async (req, res) => {

    try {

        await conexao.query(`
            UPDATE reposicao
            SET status = 'Cancelado'
            WHERE status = 'Pendente'
        `);

        res.json({
            mensagem: "Lista cancelada"
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao limpar lista"
        });
    }
});
module.exports = router;
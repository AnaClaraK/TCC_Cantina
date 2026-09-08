const express = require('express');

const router = express.Router();

const conexao = require('../db');

const verificarToken = require('../middlewares/auth');

const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";


// ============================================================
// LISTAR PRODUTOS PARA REPOSIÇÃO
// SOMENTE PRODUTOS ATIVOS
// ============================================================

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
                img,
                ativo
            FROM produtos
            WHERE ativo = 1
        `;

        let params = [];

        if (termo !== "") {

            sql += `
                AND (
                    nome LIKE ?
                    OR codigo_barras LIKE ?
                )
            `;

            params = [
                `%${termo}%`,
                `${termo}%`
            ];
        }

        sql += `
            ORDER BY nome ASC
            LIMIT 10
        `;

        const [produtos] = await conexao.query(sql, params);

        return res.json(produtos);

    } catch (erro) {

        console.error(
            "Erro ao buscar produtos para reposição:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao buscar produtos."
        });
    }

});


// ============================================================
// CRIAR REPOSIÇÃO
// BLOQUEIA PRODUTO INATIVO NO BACKEND
// ============================================================

router.put("/reposicao/:codigo", verificarToken, async (req, res) => {

    const conn = await conexao.getConnection();

    try {

        await conn.beginTransaction();

        const codigoBarras = req.params.codigo;

        const {
            quantidade,
            local,
            prioridade
        } = req.body;


        // ----------------------------------------------------
        // BUSCAR PRODUTO
        // ----------------------------------------------------

        const [produto] = await conn.query(
            `
            SELECT
                id_produto,
                nome,
                ativo
            FROM produtos
            WHERE codigo_barras = ?
            `,
            [codigoBarras]
        );


        // Produto não existe
        if (produto.length === 0) {

            await conn.rollback();

            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }


        // ----------------------------------------------------
        // BLOQUEIO DE PRODUTO INATIVO
        // ----------------------------------------------------

        if (Number(produto[0].ativo) !== 1) {

            await conn.rollback();

            return res.status(400).json({
                erro: `O produto "${produto[0].nome}" está inativo e não pode receber uma nova reposição.`
            });
        }


        const {
            id_produto,
            nome
        } = produto[0];


        // ----------------------------------------------------
        // CRIAR REPOSIÇÃO
        // ----------------------------------------------------

        await conn.query(
            `
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
            `,
            [
                id_produto,
                nome,
                quantidade,
                0,
                prioridade,
                local,
                "Pendente"
            ]
        );


        await conn.commit();


        return res.json({
            mensagem: "Reposição adicionada!"
        });


    } catch (erro) {

        await conn.rollback();

        console.error(
            "Erro ao criar reposição:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao criar reposição."
        });

    } finally {

        conn.release();
    }

});


// ============================================================
// LISTAR REPOSIÇÕES PENDENTES
// ============================================================

router.get("/reposicao", verificarToken, async (req, res) => {

    try {

        const [rows] = await conexao.query(
            `
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
            `
        );


        return res.json(rows);

    } catch (erro) {

        console.error(
            "Erro ao buscar reposição:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao buscar reposição"
        });
    }

});


// ============================================================
// CONCLUIR REPOSIÇÃO
// BLOQUEIA PRODUTO INATIVO
// ============================================================

router.put("/reposicao/:codigo/concluir", verificarToken, async (req, res) => {

    const conn = await conexao.getConnection();

    try {

        await conn.beginTransaction();

        const codigo = req.params.codigo;

        const {
            quantidade_comprada,
            local
        } = req.body;


        // ----------------------------------------------------
        // BUSCAR PRODUTO
        // ----------------------------------------------------

        const [produto] = await conn.query(
            `
            SELECT
                id_produto,
                nome,
                ativo
            FROM produtos
            WHERE codigo_barras = ?
            `,
            [codigo]
        );


        if (produto.length === 0) {

            await conn.rollback();

            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }


        // ----------------------------------------------------
        // BLOQUEIO DE PRODUTO INATIVO
        // ----------------------------------------------------

        if (Number(produto[0].ativo) !== 1) {

            await conn.rollback();

            return res.status(400).json({
                erro: `O produto "${produto[0].nome}" está inativo e não pode ter a reposição concluída.`
            });
        }


        const id_produto = produto[0].id_produto;


        // ----------------------------------------------------
        // ATUALIZAR ESTOQUE
        // ----------------------------------------------------

        await conn.query(
            `
            UPDATE produtos
            SET qtd = qtd + ?
            WHERE id_produto = ?
            `,
            [
                quantidade_comprada,
                id_produto
            ]
        );


        // ----------------------------------------------------
        // ATUALIZAR REPOSIÇÃO
        // ----------------------------------------------------

        await conn.query(
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


        await conn.commit();


        return res.json({
            mensagem: "Reposição concluída"
        });


    } catch (erro) {

        await conn.rollback();

        console.error(
            "Erro ao concluir reposição:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao concluir reposição"
        });

    } finally {

        conn.release();
    }

});


// ============================================================
// CANCELAR UMA REPOSIÇÃO
// ============================================================

router.put("/reposicao/:codigo/cancelar", verificarToken, async (req, res) => {

    try {

        const codigo = req.params.codigo;


        // ----------------------------------------------------
        // BUSCAR PRODUTO
        // ----------------------------------------------------

        const [produto] = await conexao.query(
            `
            SELECT
                id_produto
            FROM produtos
            WHERE codigo_barras = ?
            `,
            [codigo]
        );


        if (produto.length === 0) {

            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }


        const id_produto = produto[0].id_produto;


        // ----------------------------------------------------
        // CANCELAR REPOSIÇÃO PENDENTE
        // ----------------------------------------------------

        await conexao.query(
            `
            UPDATE reposicao
            SET status = 'Cancelado'
            WHERE
                id_produto = ?
                AND status = 'Pendente'
            `,
            [id_produto]
        );


        return res.json({
            mensagem: "Reposição cancelada"
        });


    } catch (erro) {

        console.error(
            "Erro ao cancelar reposição:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao cancelar reposição"
        });
    }

});


// ============================================================
// CANCELAR TODAS AS REPOSIÇÕES
// ============================================================

router.put("/reposicao/cancelar/todos", verificarToken, async (req, res) => {

    try {

        await conexao.query(
            `
            UPDATE reposicao
            SET status = 'Cancelado'
            WHERE status = 'Pendente'
            `
        );


        return res.json({
            mensagem: "Lista cancelada"
        });


    } catch (erro) {

        console.error(
            "Erro ao limpar lista:",
            erro
        );

        return res.status(500).json({
            erro: "Erro ao limpar lista"
        });
    }

});


module.exports = router;
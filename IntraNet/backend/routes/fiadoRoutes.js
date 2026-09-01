const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');

// ======================================================
// CLIENTES FIADO
// ======================================================

// ------------------------------------------------------
// CADASTRAR CLIENTE FIADO
// ------------------------------------------------------
router.post("/clientes-fiado", async (req, res) => {
    try {
        let {
            nome_completo,
            cpf,
            telefone,
            endereco
        } = req.body;

        nome_completo = nome_completo ? nome_completo.trim() : "";
        cpf = cpf ? cpf.replace(/\D/g, "") : "";
        telefone = telefone ? telefone.replace(/\D/g, "") : "";
        endereco = endereco ? endereco.trim() : "";

        if (!nome_completo || nome_completo.length < 3) {
            return res.status(400).json({
                erro: "O nome completo deve ter pelo menos 3 caracteres."
            });
        }

        if (cpf.length !== 11) {
            return res.status(400).json({
                erro: "CPF inválido. Deve conter exatamente 11 dígitos."
            });
        }

        if (telefone.length < 10 || telefone.length > 11) {
            return res.status(400).json({
                erro: "Telefone inválido. Deve conter DDD + número (10 ou 11 dígitos)."
            });
        }

        if (!endereco || endereco.length < 5) {
            return res.status(400).json({
                erro: "O endereço deve ter pelo menos 5 caracteres."
            });
        }

        await conexao.query(`
            INSERT INTO clientes_fiado
            (
                nome_completo,
                cpf,
                telefone,
                endereco
            )
            VALUES (?, ?, ?, ?)
        `, [
            nome_completo,
            cpf,
            telefone,
            endereco
        ]);

        res.json({
            sucesso: true
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            erro: err.message
        });
    }
});

// ------------------------------------------------------
// LISTAR CLIENTES
// ------------------------------------------------------
router.get("/clientes-fiado", async (req, res) => {
    try {
        const [dados] = await conexao.query(`
            SELECT *
            FROM clientes_fiado
            ORDER BY nome_completo
        `);

        res.json(dados);

    } catch (err) {
        res.status(500).json({
            erro: err.message
        });
    }
});

// ======================================================
// CONTAS FIADO
// ======================================================

// ------------------------------------------------------
// CADASTRAR CONTA FIADO
// ------------------------------------------------------
router.post("/contas-fiado", async (req, res) => {
    const {
        id_cliente,
        valor,
        vencimento,
        produtos,
        origem
    } = req.body;

    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        // --------------------------------------------------
        // VERIFICAR CLIENTE
        // --------------------------------------------------
        const [cliente] = await conn.query(`
            SELECT id_cliente
            FROM clientes_fiado
            WHERE id_cliente = ?
        `, [id_cliente]);

        if (cliente.length === 0) {
            throw new Error("Cliente não encontrado.");
        }

        // --------------------------------------------------
        // VERIFICAR PRODUTOS
        // --------------------------------------------------
        if (!Array.isArray(produtos) || produtos.length === 0) {
            throw new Error("Nenhum produto informado.");
        }

        // --------------------------------------------------
        // CRIAR CONTA
        // --------------------------------------------------
        const [conta] = await conn.query(`
            INSERT INTO contas_fiado
            (
                id_cliente,
                valor_original,
                valor_final,
                data_vencimento,
                origem,
                status,
                juros_aplicado
            )
            VALUES (?, ?, ?, ?, ?, 'Pendente', FALSE)
        `, [
            id_cliente,
            valor,
            valor,
            vencimento,
            origem
        ]);

        const idConta = conta.insertId;

        // --------------------------------------------------
        // ADICIONAR PRODUTOS
        // --------------------------------------------------
        for (const produto of produtos) {
            const [dadosProduto] = await conn.query(`
                SELECT
                    id_produto,
                    nome,
                    qtd,
                    preco
                FROM produtos
                WHERE id_produto = ?
            `, [produto.id_produto]);

            if (dadosProduto.length === 0) {
                throw new Error("Produto não encontrado.");
            }

            const estoque = Number(dadosProduto[0].qtd);
            const precoBanco = Number(dadosProduto[0].preco);
            const quantidade = Number(produto.qtdSelecionada);

            if (!Number.isFinite(quantidade) || quantidade <= 0) {
                throw new Error(`Quantidade inválida para ${dadosProduto[0].nome}`);
            }

            if (estoque <= 0) {
                throw new Error(`Produto sem estoque: ${dadosProduto[0].nome}`);
            }

            if (quantidade > estoque) {
                throw new Error(`Estoque insuficiente para ${dadosProduto[0].nome}`);
            }

            await conn.query(`
                INSERT INTO conta_fiado_prod
                (
                    id_conta,
                    id_produto,
                    qtd,
                    valor_unit
                )
                VALUES (?, ?, ?, ?)
            `, [
                idConta,
                produto.id_produto,
                quantidade,
                precoBanco
            ]);
        }

        await conn.commit();

        res.json({
            ok: true,
            id_conta: idConta
        });

    } catch (err) {
        await conn.rollback();
        console.log("Erro ao cadastrar conta fiado:", err);
        res.status(500).json({
            erro: err.message
        });
    } finally {
        conn.release();
    }
});

// ======================================================
// LISTAR CONTAS FIADO ATIVAS
// ======================================================
router.get("/contas-fiado", async (req, res) => {
    try {
        // ==================================================
        // APLICAR JUROS AUTOMATICAMENTE
        // ==================================================
        await conexao.query(`
            UPDATE contas_fiado
            SET
                valor_final = valor_original * POWER(
                    1 + 0.10,
                    DATEDIFF(CURDATE(), data_vencimento)
                ),
                juros_aplicado = TRUE,
                status = 'Atrasado'
            WHERE
                CURDATE() > data_vencimento
                AND LOWER(TRIM(status)) NOT IN (
                    'finalizado',
                    'concluido'
                )
        `);

        // ==================================================
        // REMOVER JUROS DE CONTAS AINDA NÃO VENCIDAS
        // ==================================================
        await conexao.query(`
            UPDATE contas_fiado
            SET
                valor_final = valor_original,
                juros_aplicado = FALSE,
                status = 'Pendente'
            WHERE
                CURDATE() <= data_vencimento
                AND LOWER(TRIM(status)) NOT IN (
                    'finalizado',
                    'concluido'
                )
        `);

        // ==================================================
        // BUSCAR CONTAS
        // ==================================================
        const [dados] = await conexao.query(`
            SELECT
                c.id_conta,
                cl.nome_completo,
                c.valor_original,
                c.valor_final,
                c.data_vencimento,
                c.status,
                c.origem,
                c.juros_aplicado,

                CASE
                    WHEN CURDATE() > c.data_vencimento
                    THEN DATEDIFF(
                        CURDATE(),
                        c.data_vencimento
                    )
                    ELSE 0
                END AS dias_atraso,

                GROUP_CONCAT(
                    p.nome
                    SEPARATOR ', '
                ) AS produtos,

                COALESCE(
                    SUM(cf.qtd),
                    0
                ) AS quantidade_total

            FROM contas_fiado c

            JOIN clientes_fiado cl
                ON cl.id_cliente = c.id_cliente

            LEFT JOIN conta_fiado_prod cf
                ON cf.id_conta = c.id_conta

            LEFT JOIN produtos p
                ON p.id_produto = cf.id_produto

            WHERE LOWER(TRIM(c.status))
                NOT IN (
                    'finalizado',
                    'concluido'
                )

            GROUP BY
                c.id_conta,
                cl.nome_completo,
                c.valor_original,
                c.valor_final,
                c.data_vencimento,
                c.status,
                c.origem,
                c.juros_aplicado

            ORDER BY
                c.data_vencimento ASC
        `);

        res.json(dados);

    } catch (err) {
        console.error("Erro ao listar contas fiado:", err);
        res.status(500).json({
            erro: err.message
        });
    }
});

module.exports = router;
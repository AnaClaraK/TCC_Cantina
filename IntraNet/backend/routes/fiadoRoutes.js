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

        nome_completo = nome_completo
            ? nome_completo.trim()
            : "";

        cpf = cpf
            ? cpf.replace(/\D/g, "")
            : "";

        telefone = telefone
            ? telefone.replace(/\D/g, "")
            : "";

        endereco = endereco
            ? endereco.trim()
            : "";

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

            throw new Error(
                "Cliente não encontrado."
            );

        }



        // --------------------------------------------------
        // VERIFICAR PRODUTOS
        // --------------------------------------------------

        if (
            !Array.isArray(produtos) ||
            produtos.length === 0
        ) {

            throw new Error(
                "Nenhum produto informado."
            );

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
            `, [
                produto.id_produto
            ]);

            if (dadosProduto.length === 0) {

                throw new Error(
                    "Produto não encontrado."
                );

            }

            const estoque =
                Number(dadosProduto[0].qtd);

            const precoBanco =
                Number(dadosProduto[0].preco);

            const quantidade =
                Number(produto.qtdSelecionada);

            if (
                !Number.isFinite(quantidade) ||
                quantidade <= 0
            ) {

                throw new Error(
                    `Quantidade inválida para ${dadosProduto[0].nome}`
                );

            }

            if (estoque <= 0) {

                throw new Error(
                    `Produto sem estoque: ${dadosProduto[0].nome}`
                );

            }

            if (quantidade > estoque) {

                throw new Error(
                    `Estoque insuficiente para ${dadosProduto[0].nome}`
                );

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

        console.log(
            "Erro ao cadastrar conta fiado:",
            err
        );

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
        // JUROS COMPOSTOS
        // 10% AO DIA APÓS O VENCIMENTO
        //
        // Fórmula:
        //
        // valor_final =
        // valor_original * (1.10 ^ dias_atraso)
        //
        // O cálculo sempre parte de valor_original.
        // ==================================================

        await conexao.query(`
            UPDATE contas_fiado
            SET
                valor_final =
                    valor_original *
                    POWER(
                        1.10,
                        DATEDIFF(
                            CURDATE(),
                            data_vencimento
                        )
                    ),

                juros_aplicado = TRUE,

                status = 'Atrasado'

            WHERE
                CURDATE() > data_vencimento

                AND LOWER(TRIM(status))
                    IN ('pendente', 'atrasado')
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

                SUM(cf.qtd)
                    AS quantidade_total

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

            GROUP BY c.id_conta

            ORDER BY
                c.data_vencimento ASC
        `);



        res.json(dados);

    } catch (err) {

        console.error(
            "Erro ao listar contas fiado:",
            err
        );

        res.status(500).json({
            erro: err.message
        });

    }

});



// ======================================================
// FINALIZAR CONTA FIADO
// ======================================================

router.put(
    "/contas-fiado/:id/finalizar",
    verificarToken,
    async (req, res) => {

        const conn =
            await conexao.getConnection();

        try {

            await conn.beginTransaction();

            const { id } = req.params;

            const {
                data_conclusao,
                forma_pagamento
            } = req.body;



            // --------------------------------------------------
            // VALIDAÇÕES
            // --------------------------------------------------

            if (!data_conclusao) {

                throw new Error(
                    "Data de conclusão não informada."
                );

            }

            if (!forma_pagamento) {

                throw new Error(
                    "Forma de pagamento não informada."
                );

            }



            // --------------------------------------------------
            // BUSCAR CONTA
            // --------------------------------------------------

            const [contas] =
                await conn.query(
                    `
                    SELECT

                        id_conta,

                        id_cliente,

                        valor_original,

                        valor_final,

                        origem,

                        status,

                        data_vencimento,

                        juros_aplicado

                    FROM contas_fiado

                    WHERE id_conta = ?

                    FOR UPDATE
                    `,
                    [id]
                );



            if (contas.length === 0) {

                throw new Error(
                    "Conta fiado não encontrada."
                );

            }



            const conta = contas[0];



            // --------------------------------------------------
            // VERIFICAR STATUS
            // --------------------------------------------------

            const statusAtual =
                String(conta.status || "")
                    .trim()
                    .toLowerCase();



            if (
                statusAtual === "finalizado" ||
                statusAtual === "concluido"
            ) {

                throw new Error(
                    "Esta conta já foi finalizada."
                );

            }



            // --------------------------------------------------
            // CALCULAR JUROS COMPOSTOS
            // --------------------------------------------------

            const TAXA_JUROS_DIARIA = 0.10;

            const valorOriginal =
                Number(conta.valor_original || 0);



            if (
                !Number.isFinite(valorOriginal) ||
                valorOriginal < 0
            ) {

                throw new Error(
                    "Valor original da conta inválido."
                );

            }



            const dataVencimento =
                new Date(
                    conta.data_vencimento
                );



            if (
                Number.isNaN(
                    dataVencimento.getTime()
                )
            ) {

                throw new Error(
                    "Data de vencimento da conta inválida."
                );

            }



            dataVencimento.setHours(
                0,
                0,
                0,
                0
            );



            const hoje = new Date();

            hoje.setHours(
                0,
                0,
                0,
                0
            );



            const diferenca =
                hoje.getTime() -
                dataVencimento.getTime();



            const diasAtraso =
                Math.max(
                    0,
                    Math.floor(
                        diferenca /
                        (1000 * 60 * 60 * 24)
                    )
                );



            let valorFinal =
                valorOriginal;



            // --------------------------------------------------
            // APLICA JUROS
            // --------------------------------------------------

            if (diasAtraso > 0) {

                valorFinal =
                    valorOriginal *
                    Math.pow(
                        1 + TAXA_JUROS_DIARIA,
                        diasAtraso
                    );



                await conn.query(
                    `
                    UPDATE contas_fiado

                    SET

                        valor_final = ?,

                        juros_aplicado = TRUE,

                        status = 'Atrasado'

                    WHERE id_conta = ?
                    `,
                    [
                        valorFinal,
                        id
                    ]
                );

            } else {

                await conn.query(
                    `
                    UPDATE contas_fiado

                    SET

                        valor_final =
                            valor_original,

                        juros_aplicado = FALSE

                    WHERE id_conta = ?
                    `,
                    [id]
                );

            }



            // --------------------------------------------------
            // BUSCAR PRODUTOS DA CONTA
            // --------------------------------------------------

            const [itens] =
                await conn.query(
                    `
                    SELECT

                        cf.id_produto,

                        cf.qtd,

                        cf.valor_unit,

                        p.nome,

                        p.qtd AS estoque

                    FROM conta_fiado_prod cf

                    INNER JOIN produtos p
                        ON p.id_produto =
                           cf.id_produto

                    WHERE cf.id_conta = ?
                    `,
                    [id]
                );



            if (itens.length === 0) {

                throw new Error(
                    "Esta conta não possui produtos."
                );

            }



            // --------------------------------------------------
            // USUÁRIO
            // --------------------------------------------------

            const id_user =
                req.usuarioId;



            if (!id_user) {

                throw new Error(
                    "Usuário não identificado no token."
                );

            }



            // --------------------------------------------------
            // GERAR NÚMERO DO PEDIDO
            // --------------------------------------------------

            const [ultimoPedido] =
                await conn.query(
                    `
                    SELECT

                        COALESCE(
                            MAX(num_pedido),
                            0
                        ) AS ultimoNumero

                    FROM pedidos
                    `
                );



            const num_pedido =
                Number(
                    ultimoPedido[0].ultimoNumero
                ) + 1;



            // --------------------------------------------------
            // CRIAR PEDIDO
            // --------------------------------------------------

            const [resultadoPedido] =
                await conn.query(
                    `
                    INSERT INTO pedidos
                    (
                        id_user,
                        id_cliente,
                        num_pedido,
                        data,
                        status,
                        origem,
                        form_pag,
                        valor_total,
                        qtd_total
                    )

                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        'Finalizado',
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [

                        id_user,

                        conta.id_cliente,

                        num_pedido,

                        data_conclusao,

                        conta.origem ||
                            "Fiado",

                        forma_pagamento,

                        valorFinal,

                        itens.reduce(
                            (total, item) =>
                                total +
                                Number(item.qtd),
                            0
                        )

                    ]
                );



            const id_pedido =
                resultadoPedido.insertId;



            // --------------------------------------------------
            // BAIXAR ESTOQUE
            // --------------------------------------------------

            for (const item of itens) {

                const estoqueAtual =
                    Number(item.estoque);

                const quantidade =
                    Number(item.qtd);



                if (
                    !Number.isFinite(
                        quantidade
                    ) ||
                    quantidade <= 0
                ) {

                    throw new Error(
                        `Quantidade inválida para ${item.nome}.`
                    );

                }



                if (
                    estoqueAtual <
                    quantidade
                ) {

                    throw new Error(
                        `Estoque insuficiente para: ${item.nome}.`
                    );

                }



                const novaQtd =
                    estoqueAtual -
                    quantidade;



                await conn.query(
                    `
                    UPDATE produtos

                    SET qtd = ?

                    WHERE id_produto = ?
                    `,
                    [
                        novaQtd,
                        item.id_produto
                    ]
                );



                await conn.query(
                    `
                    INSERT INTO pedidos_itens
                    (
                        id_pedido,
                        id_produto,
                        qtd,
                        preco_unitario
                    )

                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        id_pedido,

                        item.id_produto,

                        quantidade,

                        Number(
                            item.valor_unit
                        )
                    ]
                );

            }



            // --------------------------------------------------
            // FINALIZAR CONTA
            // --------------------------------------------------

            const [resultadoFinalizacao] =
                await conn.query(
                    `
                    UPDATE contas_fiado

                    SET

                        status = 'Finalizado',

                        valor_final = ?,

                        data_pagamento = ?

                    WHERE id_conta = ?
                    `,
                    [
                        valorFinal,

                        data_conclusao,

                        id
                    ]
                );



            if (
                resultadoFinalizacao.affectedRows !== 1
            ) {

                throw new Error(
                    "A conta não foi atualizada no banco de dados."
                );

            }



            // --------------------------------------------------
            // COMMIT
            // --------------------------------------------------

            await conn.commit();



            res.json({

                sucesso: true,

                mensagem:
                    "Pagamento registrado e conta finalizada com sucesso.",

                id_conta:
                    id,

                id_pedido:
                    id_pedido,

                num_pedido:
                    num_pedido,

                valor_original:
                    valorOriginal,

                valor_pago:
                    valorFinal,

                dias_atraso:
                    diasAtraso,

                juros_compostos:
                    diasAtraso > 0

            });



        } catch (erro) {

            await conn.rollback();

            console.error(
                "ERRO AO FINALIZAR CONTA:",
                erro
            );

            res.status(500).json({

                sucesso: false,

                erro:
                    erro.message

            });



        } finally {

            conn.release();

        }

    }
);



module.exports = router;
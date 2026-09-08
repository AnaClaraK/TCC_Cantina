const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');

// ======================================================
// CLIENTES FIADO
// ======================================================

router.post('/clientes-fiado', async (req, res) => {
    try {
        let { nome_completo, cpf, telefone, endereco } = req.body;

        nome_completo = nome_completo ? nome_completo.trim() : '';
        cpf = cpf ? cpf.replace(/\D/g, '') : '';
        telefone = telefone ? telefone.replace(/\D/g, '') : '';
        endereco = endereco ? endereco.trim() : '';

        if (!nome_completo || nome_completo.length < 3) {
            return res.status(400).json({
                erro: 'O nome completo deve ter pelo menos 3 caracteres.'
            });
        }

        if (cpf.length !== 11) {
            return res.status(400).json({
                erro: 'CPF inválido. Deve conter exatamente 11 dígitos.'
            });
        }

        if (telefone.length < 10 || telefone.length > 11) {
            return res.status(400).json({
                erro: 'Telefone inválido. Deve conter DDD + número (10 ou 11 dígitos).'
            });
        }

        if (!endereco || endereco.length < 5) {
            return res.status(400).json({
                erro: 'O endereço deve ter pelo menos 5 caracteres.'
            });
        }

        await conexao.query(`
            INSERT INTO clientes_fiado
            (nome_completo, cpf, telefone, endereco)
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
        console.error(
            'Erro ao cadastrar cliente fiado:',
            err
        );

        res.status(500).json({
            erro: err.message
        });
    }
});

router.get('/clientes-fiado', async (req, res) => {
    try {
        const [dados] = await conexao.query(`
            SELECT *
            FROM clientes_fiado
            ORDER BY nome_completo
        `);

        res.json(dados);

    } catch (err) {
        console.error(
            'Erro ao listar clientes fiado:',
            err
        );

        res.status(500).json({
            erro: err.message
        });
    }
});

// ======================================================
// CADASTRAR CONTA FIADO
// ======================================================

router.post('/contas-fiado', async (req, res) => {

    const conn =
        await conexao.getConnection();

    try {

        await conn.beginTransaction();

        const {
            id_cliente,
            valor,
            vencimento,
            produtos,
            origem
        } = req.body;

        if (!id_cliente) {
            throw new Error(
                'Cliente não informado.'
            );
        }

        if (
            !Number.isFinite(Number(valor)) ||
            Number(valor) <= 0
        ) {
            throw new Error(
                'Valor da conta inválido.'
            );
        }

        if (!vencimento) {
            throw new Error(
                'Data de vencimento não informada.'
            );
        }

        if (
            !Array.isArray(produtos) ||
            produtos.length === 0
        ) {
            throw new Error(
                'Nenhum produto informado.'
            );
        }

        const [conta] =
            await conn.query(`
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
                Number(valor),
                Number(valor),
                vencimento,
                origem || 'Fiado'
            ]);

        const idConta =
            conta.insertId;

        // ==================================================
        // PRODUTOS DA CONTA
        // ==================================================

        for (const produto of produtos) {

            const [dadosProduto] =
                await conn.query(`
                    SELECT
                        id_produto,
                        nome,
                        qtd,
                        preco
                    FROM produtos
                    WHERE id_produto = ?
                    FOR UPDATE
                `, [
                    produto.id_produto
                ]);

            if (
                dadosProduto.length === 0
            ) {
                throw new Error(
                    'Produto não encontrado.'
                );
            }

            const estoque =
                Number(
                    dadosProduto[0].qtd
                );

            const precoBanco =
                Number(
                    dadosProduto[0].preco
                );

            const quantidade =
                Number(
                    produto.qtdSelecionada
                );

            if (
                !Number.isFinite(
                    quantidade
                ) ||
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

            if (
                quantidade > estoque
            ) {
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

        console.error(
            'Erro ao cadastrar conta fiado:',
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
// LISTAR CONTAS FIADO
// ======================================================
//
// ATENÇÃO:
// NÃO aplica juros automaticamente.
// NÃO existe 10% fixo.
// NÃO altera valor_final ao simplesmente abrir a página.
//

router.get('/contas-fiado', async (req, res) => {

    try {

        const [dados] =
            await conexao.query(`
                SELECT
                    c.id_conta,
                    c.id_cliente,
                    cl.nome_completo,
                    c.valor_original,
                    c.valor_final,
                    c.data_vencimento,

                    CASE
                        WHEN CURDATE() > c.data_vencimento
                        THEN DATEDIFF(
                            CURDATE(),
                            c.data_vencimento
                        )
                        ELSE 0
                    END AS dias_atraso,

                    c.juros_aplicado,
                    c.status,
                    c.origem,

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
                    ON cl.id_cliente =
                       c.id_cliente

                LEFT JOIN conta_fiado_prod cf
                    ON cf.id_conta =
                       c.id_conta

                LEFT JOIN produtos p
                    ON p.id_produto =
                       cf.id_produto

                WHERE LOWER(
                    TRIM(c.status)
                ) NOT IN (
                    'finalizado',
                    'concluido'
                )

                GROUP BY
                    c.id_conta

                ORDER BY
                    c.data_vencimento ASC,
                    c.id_conta ASC
            `);

        res.json(dados);

    } catch (err) {

        console.error(
            'Erro ao listar contas fiado:',
            err
        );

        res.status(500).json({
            erro: err.message
        });
    }
});

// ======================================================
// LISTAR CONTAS DE UM CLIENTE
// ======================================================
//
// Usado pelo modal:
// GET /contas-fiado/cliente/:id
//
router.get(
    '/contas-fiado/cliente/:id',
    async (req, res) => {
        try {
            const idCliente = Number(req.params.id);

            if (!Number.isInteger(idCliente) || idCliente <= 0) {
                return res.status(400).json({
                    erro: 'Cliente inválido.'
                });
            }

            // Sua versão do MariaDB não possui JSON_ARRAYAGG.
            // Buscamos as contas primeiro e depois seus produtos.

            const [dados] = await conexao.query(`
                SELECT
                    c.id_conta,
                    c.id_cliente,
                    cl.nome_completo,
                    c.valor_original,
                    c.valor_final,
                    c.data_vencimento,

                    CASE
                        WHEN CURDATE() > c.data_vencimento
                        THEN DATEDIFF(
                            CURDATE(),
                            c.data_vencimento
                        )
                        ELSE 0
                    END AS dias_atraso,

                    c.juros_aplicado,
                    c.status,
                    c.origem

                FROM contas_fiado c

                INNER JOIN clientes_fiado cl
                    ON cl.id_cliente = c.id_cliente

                WHERE c.id_cliente = ?

                  AND LOWER(
                      TRIM(c.status)
                  ) NOT IN (
                      'finalizado',
                      'concluido',
                      'pago'
                  )

                ORDER BY
                    c.data_vencimento ASC,
                    c.id_conta ASC
            `, [idCliente]);

            if (dados.length === 0) {
                return res.json([]);
            }

            const idsContas =
                dados.map(
                    conta => Number(conta.id_conta)
                );

            const placeholders =
                idsContas
                    .map(() => '?')
                    .join(',');

            const [itens] =
                await conexao.query(`
                    SELECT
                        cf.id_conta,
                        cf.id_produto,
                        p.nome,
                        cf.qtd AS quantidade,
                        cf.valor_unit AS valor_unitario

                    FROM conta_fiado_prod cf

                    INNER JOIN produtos p
                        ON p.id_produto =
                           cf.id_produto

                    WHERE cf.id_conta
                          IN (${placeholders})

                    ORDER BY
                        cf.id_conta ASC,
                        p.nome ASC
                `, idsContas);

            const produtosPorConta =
                new Map();

            for (const item of itens) {

                const idConta =
                    Number(item.id_conta);

                if (
                    !produtosPorConta.has(
                        idConta
                    )
                ) {
                    produtosPorConta.set(
                        idConta,
                        []
                    );
                }

                produtosPorConta
                    .get(idConta)
                    .push({
                        id_produto:
                            Number(
                                item.id_produto
                            ),

                        nome:
                            item.nome ||
                            'Produto',

                        quantidade:
                            Number(
                                item.quantidade ||
                                0
                            ),

                        valor_unitario:
                            Number(
                                item.valor_unitario ||
                                0
                            )
                    });
            }

            for (const conta of dados) {

                conta.id_conta =
                    Number(
                        conta.id_conta
                    );

                conta.id_cliente =
                    Number(
                        conta.id_cliente
                    );

                conta.valor_original =
                    Number(
                        conta.valor_original ||
                        0
                    );

                conta.valor_final =
                    Number(
                        conta.valor_final ??
                        conta.valor_original
                    );

                conta.dias_atraso =
                    Number(
                        conta.dias_atraso ||
                        0
                    );

                conta.produtos =
                    produtosPorConta.get(
                        conta.id_conta
                    ) || [];
            }

            return res.json(dados);

        } catch (err) {

            console.error(
                'Erro ao listar contas do cliente:',
                err
            );

            return res.status(500).json({
                erro: err.message
            });
        }
    }
);
// ======================================================
// APLICAR JUROS MANUALMENTE
// ======================================================
//
// REGRA:
//
// Juros simples.
//
// Exemplo:
//
// R$ 100
// 2% ao dia
// 5 dias
//
// juros = 100 * 0,02 * 5
// juros = 10
//
// valor_final = 110
//
// NÃO usa juros compostos.
// NÃO usa 10% fixo.
// NÃO recalcula automaticamente.
// Só aplica quando o usuário clicar em
// "Aplicar Juros".
//

router.put(
    '/contas-fiado/juros/aplicar',
    verificarToken,
    async (req, res) => {

        const conn =
            await conexao.getConnection();

        try {

            await conn.beginTransaction();

            const {
                contas,
                percentual,
                tipo,
                cliente
            } = req.body;

            const taxa =
                Number(percentual);

            // ==================================================
            // VALIDAÇÕES
            // ==================================================

            if (
                !Array.isArray(contas) ||
                contas.length === 0
            ) {

                throw new Error(
                    'Nenhuma conta foi selecionada.'
                );
            }

            if (
                !Number.isFinite(taxa) ||
                taxa <= 0
            ) {

                throw new Error(
                    'Porcentagem de juros inválida.'
                );
            }

            if (
                ![
                    'dia',
                    'mes'
                ].includes(
                    String(tipo)
                )
            ) {

                throw new Error(
                    'Tipo de juros inválido.'
                );
            }

            if (
                cliente !== undefined &&
                cliente !== null &&
                !Number.isFinite(
                    Number(cliente)
                )
            ) {

                throw new Error(
                    'Cliente inválido.'
                );
            }

            const resultados = [];

            // ==================================================
            // CADA CONTA
            // ==================================================

            for (const item of contas) {

                const idConta =
                    Number(
                        item.id_conta ||
                        item.id
                    );

                if (
                    !Number.isInteger(
                        idConta
                    ) ||
                    idConta <= 0
                ) {

                    throw new Error(
                        'Uma das contas selecionadas é inválida.'
                    );
                }

                // ==============================================
                // BUSCAR CONTA
                // ==============================================

                const [rows] =
                    await conn.query(`
                        SELECT
                            id_conta,
                            id_cliente,
                            valor_original,
                            valor_final,
                            data_vencimento,
                            status
                        FROM contas_fiado
                        WHERE id_conta = ?
                        FOR UPDATE
                    `, [
                        idConta
                    ]);

                if (
                    rows.length === 0
                ) {

                    throw new Error(
                        `Conta ${idConta} não encontrada.`
                    );
                }

                const conta =
                    rows[0];

                const status =
                    String(
                        conta.status || ''
                    )
                        .trim()
                        .toLowerCase();

                if (
                    [
                        'finalizado',
                        'concluido'
                    ].includes(
                        status
                    )
                ) {

                    throw new Error(
                        `A conta ${idConta} já foi finalizada.`
                    );
                }

                const valorOriginal =
                    Number(
                        conta.valor_original
                    );

                if (
                    !Number.isFinite(
                        valorOriginal
                    ) ||
                    valorOriginal <= 0
                ) {

                    throw new Error(
                        `Valor original inválido na conta ${idConta}.`
                    );
                }

                // ==============================================
                // DATA
                // ==============================================

                const dataTexto =
                    String(
                        conta.data_vencimento
                    ).slice(0, 10);

                const dataVencimento =
                    new Date(
                        `${dataTexto}T00:00:00`
                    );

                const hoje =
                    new Date();

                hoje.setHours(
                    0,
                    0,
                    0,
                    0
                );

                if (
                    Number.isNaN(
                        dataVencimento.getTime()
                    )
                ) {

                    throw new Error(
                        `Data de vencimento inválida na conta ${idConta}.`
                    );
                }

                // ==============================================
                // DIAS DE ATRASO
                // ==============================================

                const diasAtraso =
                    Math.max(
                        0,
                        Math.floor(
                            (
                                hoje -
                                dataVencimento
                            ) /
                            86400000
                        )
                    );

                // ==============================================
                // SE NÃO ESTÁ ATRASADA
                // ==============================================

                if (
                    diasAtraso <= 0
                ) {

                    resultados.push({
                        id_conta:
                            idConta,

                        valor_original:
                            valorOriginal,

                        juros: 0,

                        valor_final:
                            valorOriginal,

                        dias_atraso: 0
                    });

                    continue;
                }

                // ==============================================
                // PERÍODOS
                // ==============================================

                let periodos;

                if (
                    String(tipo) ===
                    'dia'
                ) {

                    periodos =
                        diasAtraso;

                } else {

                    periodos =
                        diasAtraso / 30;
                }

                // ==============================================
                // JUROS SIMPLES
                // ==============================================

                const juros =
                    valorOriginal *
                    (
                        taxa / 100
                    ) *
                    periodos;

                // ==============================================
                // VALOR FINAL
                // ==============================================

                const valorFinal =
                    Math.round(
                        (
                            valorOriginal +
                            juros
                        ) *
                        100
                    ) / 100;

                // ==============================================
                // SALVAR
                // ==============================================

                await conn.query(`
                    UPDATE contas_fiado

                    SET
                        valor_final = ?,
                        juros_aplicado = TRUE,
                        status = 'Atrasado'

                    WHERE id_conta = ?

                `, [
                    valorFinal,
                    idConta
                ]);

                resultados.push({

                    id_conta:
                        idConta,

                    valor_original:
                        valorOriginal,

                    juros:
                        juros,

                    valor_final:
                        valorFinal,

                    dias_atraso:
                        diasAtraso,

                    tipo:
                        tipo,

                    percentual:
                        taxa
                });
            }

            // ==================================================
            // COMMIT
            // ==================================================

            await conn.commit();

            res.json({

                sucesso: true,

                cliente:
                    cliente ??
                    null,

                tipo:
                    tipo,

                percentual:
                    taxa,

                contas:
                    resultados
            });

        } catch (err) {

            await conn.rollback();

            console.error(
                'Erro ao aplicar juros:',
                err
            );

            res.status(500).json({

                sucesso: false,

                erro:
                    err.message
            });

        } finally {

            conn.release();
        }
    }
);

// ======================================================
// FINALIZAR CONTA FIADO
// ======================================================
//
// IMPORTANTE:
//
// NÃO aplica 10%.
// NÃO calcula juros novamente.
//
// Usa o valor_final que já estiver salvo.
//
// Se nunca foi aplicado juros:
//
// valor_final = valor_original
//
// Se o usuário aplicou juros:
//
// valor_final = valor já calculado.
//

router.put(
    '/contas-fiado/:id/finalizar',
    verificarToken,
    async (req, res) => {

        const conn =
            await conexao.getConnection();

        try {

            await conn.beginTransaction();

            const {
                id
            } = req.params;

            const {
                data_conclusao,
                forma_pagamento
            } = req.body;

            // ==================================================
            // VALIDAÇÕES
            // ==================================================

            if (
                !data_conclusao
            ) {

                throw new Error(
                    'Data de conclusão não informada.'
                );
            }

            if (
                !forma_pagamento
            ) {

                throw new Error(
                    'Forma de pagamento não informada.'
                );
            }

            // ==================================================
            // BUSCAR CONTA
            // ==================================================

            const [contas] =
                await conn.query(`
                    SELECT
                        id_conta,
                        id_cliente,
                        valor_original,
                        valor_final,
                        origem,
                        status

                    FROM contas_fiado

                    WHERE id_conta = ?

                    FOR UPDATE
                `, [
                    id
                ]);

            if (
                contas.length === 0
            ) {

                throw new Error(
                    'Conta fiado não encontrada.'
                );
            }

            const conta =
                contas[0];

            const statusAtual =
                String(
                    conta.status || ''
                )
                    .trim()
                    .toLowerCase();

            if (
                [
                    'finalizado',
                    'concluido'
                ].includes(
                    statusAtual
                )
            ) {

                throw new Error(
                    'Esta conta já foi finalizada.'
                );
            }

            // ==================================================
            // VALORES
            // ==================================================

            const valorOriginal =
                Number(
                    conta.valor_original ||
                    0
                );

            const valorFinal =
                Number(
                    conta.valor_final ??
                    valorOriginal
                );

            if (
                !Number.isFinite(
                    valorOriginal
                ) ||
                valorOriginal < 0
            ) {

                throw new Error(
                    'Valor original da conta inválido.'
                );
            }

            if (
                !Number.isFinite(
                    valorFinal
                ) ||
                valorFinal < 0
            ) {

                throw new Error(
                    'Valor final da conta inválido.'
                );
            }

            // ==================================================
            // PRODUTOS
            // ==================================================

            const [itens] =
                await conn.query(`
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

                    FOR UPDATE
                `, [
                    id
                ]);

            if (
                itens.length === 0
            ) {

                throw new Error(
                    'Esta conta não possui produtos.'
                );
            }

            // ==================================================
            // USUÁRIO
            // ==================================================

            const id_user =
                req.usuarioId;

            if (!id_user) {

                throw new Error(
                    'Usuário não identificado no token.'
                );
            }

            // ==================================================
            // NÚMERO DO PEDIDO
            // ==================================================

            const [ultimoPedido] =
                await conn.query(`
                    SELECT
                        COALESCE(
                            MAX(num_pedido),
                            0
                        ) AS ultimoNumero

                    FROM pedidos
                `);

            const num_pedido =
                Number(
                    ultimoPedido[0]
                        .ultimoNumero
                ) + 1;

            // ==================================================
            // CRIAR PEDIDO
            // ==================================================

            const [
                resultadoPedido
            ] =
                await conn.query(`
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
                `, [

                    id_user,

                    conta.id_cliente,

                    num_pedido,

                    data_conclusao,

                    conta.origem ||
                        'Fiado',

                    forma_pagamento,

                    valorFinal,

                    itens.reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            Number(
                                item.qtd
                            ),
                        0
                    )
                ]);

            const id_pedido =
                resultadoPedido.insertId;

            // ==================================================
            // BAIXAR ESTOQUE
            // ==================================================

            for (
                const item
                of itens
            ) {

                const estoqueAtual =
                    Number(
                        item.estoque
                    );

                const quantidade =
                    Number(
                        item.qtd
                    );

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

                await conn.query(`
                    UPDATE produtos

                    SET
                        qtd = ?

                    WHERE id_produto = ?

                `, [
                    estoqueAtual -
                        quantidade,

                    item.id_produto
                ]);

                // ==============================================
                // ITENS DO PEDIDO
                // ==============================================

                await conn.query(`
                    INSERT INTO pedidos_itens
                    (
                        id_pedido,
                        id_produto,
                        qtd,
                        preco_unitario
                    )

                    VALUES (?, ?, ?, ?)

                `, [
                    id_pedido,

                    item.id_produto,

                    quantidade,

                    Number(
                        item.valor_unit
                    )
                ]);
            }

            // ==================================================
            // FINALIZAR CONTA
            // ==================================================

            const [
                resultadoFinalizacao
            ] =
                await conn.query(`
                    UPDATE contas_fiado

                    SET
                        status = 'Finalizado',
                        data_pagamento = ?

                    WHERE id_conta = ?

                `, [
                    data_conclusao,
                    id
                ]);

            if (
                resultadoFinalizacao
                    .affectedRows !== 1
            ) {

                throw new Error(
                    'A conta não foi atualizada no banco de dados.'
                );
            }

            // ==================================================
            // COMMIT
            // ==================================================

            await conn.commit();

            res.json({

                sucesso: true,

                mensagem:
                    'Pagamento registrado e conta finalizada com sucesso.',

                id_conta:
                    Number(id),

                id_pedido:
                    id_pedido,

                num_pedido:
                    num_pedido,

                valor_original:
                    valorOriginal,

                valor_pago:
                    valorFinal
            });

        } catch (erro) {

            await conn.rollback();

            console.error(
                'ERRO AO FINALIZAR CONTA:',
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
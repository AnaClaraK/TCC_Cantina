const express = require("express");
const verificarToken = require("../middlewares/auth");
const router = express.Router();
const conexao = require("../db");

// ======================================================
// FUNÇÕES AUXILIARES
// ======================================================

function dataHojeISO() {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function normalizarTipoJuros(tipo) {
    return String(tipo || "").trim().toLowerCase() === "mes"
        ? "mes"
        : "dia";
}

function validarTaxa(taxa) {
    const valor = Number(taxa);

    if (!Number.isFinite(valor) || valor <= 0 || valor > 1000) {
        throw new Error(
            "A taxa de juros deve ser maior que 0 e menor ou igual a 1000%."
        );
    }

    return valor;
}

function arredondar(valor) {
    return Math.round(
        (Number(valor || 0) + Number.EPSILON) * 100
    ) / 100;
}

function dataSemHora(data) {
    if (!data) return null;

    const d = new Date(data);

    if (Number.isNaN(d.getTime())) {
        return null;
    }

    return new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
    );
}

function calcularDiasEntreDatas(dataInicial, dataFinal = new Date()) {
    const inicio = dataSemHora(dataInicial);
    const fim = dataSemHora(dataFinal);

    if (!inicio || !fim) {
        return 0;
    }

    return Math.max(
        0,
        Math.floor((fim - inicio) / 86400000)
    );
}

function calcularDiasAtraso(dataVencimento) {
    return calcularDiasEntreDatas(
        dataVencimento,
        new Date()
    );
}

// ======================================================
// JUROS SIMPLES
// ======================================================
//
// JUROS POR DIA:
// valor * (1 + taxa/100 * dias)
//
// JUROS POR MÊS:
// valor * (1 + taxa/100 * dias/30)
//
// ======================================================

function calcularJurosSimples(
    valorBase,
    taxa,
    tipo,
    dias
) {
    const valor = Number(valorBase) || 0;
    const percentual = Number(taxa) || 0;
    const quantidadeDias = Math.max(
        0,
        Number(dias) || 0
    );

    if (tipo === "mes") {
        return valor * (
            1 +
            (percentual / 100) *
            (quantidadeDias / 30)
        );
    }

    return valor * (
        1 +
        (percentual / 100) *
        quantidadeDias
    );
}

// ======================================================
// CALCULAR VALOR ATUAL DO ITEM
// ======================================================

function calcularValorAtualItem(item) {
    const valorBase = Number(
        item.valor_base || 0
    );

    if (Number(item.juros_ativo) !== 1) {
        return arredondar(valorBase);
    }

    const taxa = Number(
        item.taxa_juros || 0
    );

    const tipo = normalizarTipoJuros(
        item.tipo_juros
    );

    const valorInicialJuros = Number(
        item.valor_juros_inicio || valorBase
    );

    const diasDesdeAplicacao =
        calcularDiasEntreDatas(
            item.data_inicio_juros,
            new Date()
        );

    return arredondar(
        calcularJurosSimples(
            valorInicialJuros,
            taxa,
            tipo,
            diasDesdeAplicacao
        )
    );
}

// ======================================================
// ATUALIZAR STATUS DA CONTA
// ======================================================

async function atualizarStatusConta(
    conn,
    idConta
) {
    const [pendentes] = await conn.query(
        `
        SELECT COUNT(*) AS quantidade
        FROM conta_fiado_prod
        WHERE id_conta = ?
          AND LOWER(
                TRIM(
                    COALESCE(
                        status_pagamento,
                        'Pendente'
                    )
                )
              ) <> 'pago'
        `,
        [idConta]
    );

    const quantidadePendente = Number(
        pendentes[0]?.quantidade || 0
    );

    // --------------------------------------------------
    // TODOS OS PRODUTOS PAGOS
    // --------------------------------------------------

    if (quantidadePendente === 0) {
        await conn.query(
            `
            UPDATE contas_fiado
            SET status = 'Finalizado'
            WHERE id_conta = ?
            `,
            [idConta]
        );

        return "Finalizado";
    }

    // --------------------------------------------------
    // VERIFICAR VENCIMENTO
    // --------------------------------------------------

    const [conta] = await conn.query(
        `
        SELECT data_vencimento
        FROM contas_fiado
        WHERE id_conta = ?
        `,
        [idConta]
    );

    if (
        conta.length > 0 &&
        calcularDiasAtraso(
            conta[0].data_vencimento
        ) > 0
    ) {
        await conn.query(
            `
            UPDATE contas_fiado
            SET status = 'Atrasado'
            WHERE id_conta = ?
            `,
            [idConta]
        );

        return "Atrasado";
    }

    await conn.query(
        `
        UPDATE contas_fiado
        SET status = 'Pendente'
        WHERE id_conta = ?
        `,
        [idConta]
    );

    return "Pendente";
}

// ======================================================
// FINALIZAR HISTÓRICO DA CONTA
// ======================================================
//
// Essa função é chamada somente quando TODOS os produtos
// da conta já estiverem pagos.
//
// Não baixa estoque aqui.
// O estoque já foi baixado quando a conta foi criada.
//
// ======================================================

async function criarHistoricoConta(
    conn,
    idConta,
    dataPagamento,
    formaPagamento
) {
    // --------------------------------------------------
    // BUSCAR CONTA
    // --------------------------------------------------

    const [contas] = await conn.query(
        `
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
        `,
        [idConta]
    );

    if (contas.length === 0) {
        throw new Error(
            "Conta fiado não encontrada."
        );
    }

    const conta = contas[0];

    // --------------------------------------------------
    // VERIFICAR SE JÁ FOI FINALIZADA
    // --------------------------------------------------

    if (
        String(conta.status || "")
            .trim()
            .toLowerCase() === "finalizado"
    ) {
        return null;
    }

    // --------------------------------------------------
    // VERIFICAR SE AINDA EXISTEM PRODUTOS PENDENTES
    // --------------------------------------------------

    const [pendentes] = await conn.query(
        `
        SELECT COUNT(*) AS quantidade
        FROM conta_fiado_prod
        WHERE id_conta = ?
          AND LOWER(
                TRIM(
                    COALESCE(
                        status_pagamento,
                        'Pendente'
                    )
                )
              ) <> 'pago'
        `,
        [idConta]
    );

    if (Number(pendentes[0]?.quantidade || 0) > 0) {
        return null;
    }

    // --------------------------------------------------
    // BUSCAR PRODUTOS PARA O HISTÓRICO
    // --------------------------------------------------

    const [itens] = await conn.query(
        `
        SELECT
            cf.id_produto,
            cf.qtd,
            cf.valor_unit,
            p.nome
        FROM conta_fiado_prod cf
        INNER JOIN produtos p
            ON p.id_produto = cf.id_produto
        WHERE cf.id_conta = ?
        `,
        [idConta]
    );

    if (itens.length === 0) {
        throw new Error(
            "Esta conta não possui produtos."
        );
    }

    // --------------------------------------------------
    // GERAR NÚMERO DO PEDIDO
    // --------------------------------------------------

    const [ultimoPedido] = await conn.query(
        `
        SELECT
            COALESCE(
                MAX(num_pedido),
                0
            ) AS ultimoNumero
        FROM pedidos
        `
    );

    const numPedido =
        Number(
            ultimoPedido[0]?.ultimoNumero || 0
        ) + 1;

    // --------------------------------------------------
    // USUÁRIO
    // --------------------------------------------------

    // Tenta pegar o usuário do token caso exista.
    // Como esta rota também pode estar sendo usada sem
    // middleware, fica NULL se não existir.
    const idUser =
        null;

    // --------------------------------------------------
    // VALOR FINAL REAL
    // --------------------------------------------------

    const valorFinal = arredondar(
        itens.reduce(
            (total, item) => {
                return total +
                    Number(item.qtd || 0) *
                    Number(item.valor_unit || 0);
            },
            0
        )
    );

    const quantidadeTotal =
        itens.reduce(
            (total, item) => {
                return total +
                    Number(item.qtd || 0);
            },
            0
        );

    // --------------------------------------------------
    // CRIAR PEDIDO NO HISTÓRICO
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
            VALUES
            (
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
                idUser,
                conta.id_cliente,
                numPedido,
                dataPagamento,
                conta.origem || "Fiado",
                formaPagamento,
                valorFinal,
                quantidadeTotal
            ]
        );

    const idPedido =
        resultadoPedido.insertId;

    // --------------------------------------------------
    // INSERIR PRODUTOS NO HISTÓRICO
    // --------------------------------------------------

    for (const item of itens) {
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
                idPedido,
                item.id_produto,
                item.qtd,
                item.valor_unit
            ]
        );
    }

    // --------------------------------------------------
    // FINALIZAR CONTA
    // --------------------------------------------------

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
            dataPagamento,
            idConta
        ]
    );

    return {
        id_pedido: idPedido,
        num_pedido: numPedido
    };
}

// ======================================================
// CLIENTES FIADO
// ======================================================

// ------------------------------------------------------
// CADASTRAR CLIENTE
// ------------------------------------------------------

router.post(
    "/clientes-fiado",
    async (req, res) => {
        try {
            let {
                nome_completo,
                cpf,
                telefone,
                endereco
            } = req.body;

            nome_completo =
                nome_completo
                    ? String(
                        nome_completo
                    ).trim()
                    : "";

            cpf =
                cpf
                    ? String(cpf)
                        .replace(/\D/g, "")
                    : "";

            telefone =
                telefone
                    ? String(telefone)
                        .replace(/\D/g, "")
                    : "";

            endereco =
                endereco
                    ? String(endereco).trim()
                    : "";

            if (
                !nome_completo ||
                nome_completo.length < 3
            ) {
                return res.status(400).json({
                    erro:
                        "O nome completo deve ter pelo menos 3 caracteres."
                });
            }

            if (cpf.length !== 11) {
                return res.status(400).json({
                    erro:
                        "CPF inválido. Deve conter exatamente 11 dígitos."
                });
            }

            if (
                telefone.length < 10 ||
                telefone.length > 11
            ) {
                return res.status(400).json({
                    erro:
                        "Telefone inválido. Deve conter DDD + número."
                });
            }

            if (
                !endereco ||
                endereco.length < 5
            ) {
                return res.status(400).json({
                    erro:
                        "O endereço deve ter pelo menos 5 caracteres."
                });
            }

            // --------------------------------------------------
            // VERIFICAR CPF DUPLICADO
            // --------------------------------------------------

            const [existente] =
                await conexao.query(
                    `
                    SELECT id_cliente
                    FROM clientes_fiado
                    WHERE cpf = ?
                    LIMIT 1
                    `,
                    [cpf]
                );

            if (existente.length > 0) {
                return res.status(409).json({
                    erro:
                        "Já existe um cliente cadastrado com este CPF."
                });
            }

            await conexao.query(
                `
                INSERT INTO clientes_fiado
                (
                    nome_completo,
                    cpf,
                    telefone,
                    endereco
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    nome_completo,
                    cpf,
                    telefone,
                    endereco
                ]
            );

            res.status(201).json({
                sucesso: true,
                mensagem:
                    "Cliente cadastrado com sucesso."
            });

        } catch (err) {
            console.error(
                "Erro ao cadastrar cliente fiado:",
                err
            );

            res.status(500).json({
                erro: err.message
            });
        }
    }
);

// ------------------------------------------------------
// LISTAR CLIENTES
// ------------------------------------------------------

router.get(
    "/clientes-fiado",
    async (req, res) => {
        try {
            const [dados] =
                await conexao.query(
                    `
                    SELECT *
                    FROM clientes_fiado
                    ORDER BY nome_completo
                    `
                );

            res.json(dados);

        } catch (err) {
            console.error(
                "Erro ao listar clientes fiado:",
                err
            );

            res.status(500).json({
                erro: err.message
            });
        }
    }
);

// ======================================================
// CONTAS FIADO
// ======================================================

// ------------------------------------------------------
// CRIAR CONTA FIADO
// ------------------------------------------------------
//
// IMPORTANTE:
// A baixa do estoque acontece AQUI.
// Assim o produto não fica disponível para outra venda.
//
// ------------------------------------------------------

router.post(
    "/contas-fiado",
    async (req, res) => {
        const {
            id_cliente,
            vencimento,
            produtos,
            origem
        } = req.body;

        if (!id_cliente) {
            return res.status(400).json({
                erro:
                    "Cliente não informado."
            });
        }

        if (!vencimento) {
            return res.status(400).json({
                erro:
                    "Data de vencimento não informada."
            });
        }

        if (
            !origem ||
            !String(origem).trim()
        ) {
            return res.status(400).json({
                erro:
                    "Origem da compra não informada."
            });
        }

        if (
            !Array.isArray(produtos) ||
            produtos.length === 0
        ) {
            return res.status(400).json({
                erro:
                    "Nenhum produto informado."
            });
        }

        const conn =
            await conexao.getConnection();

        try {
            await conn.beginTransaction();

            // --------------------------------------------------
            // CLIENTE
            // --------------------------------------------------

            const [cliente] =
                await conn.query(
                    `
                    SELECT id_cliente
                    FROM clientes_fiado
                    WHERE id_cliente = ?
                    FOR UPDATE
                    `,
                    [Number(id_cliente)]
                );

            if (cliente.length === 0) {
                throw new Error(
                    "Cliente não encontrado."
                );
            }

            let total = 0;

            const itensValidados = [];

            // --------------------------------------------------
            // VALIDAR PRODUTOS
            // --------------------------------------------------

            for (const produto of produtos) {
                const idProduto =
                    Number(
                        produto.id_produto
                    );

                // Aceita qtdSelecionada e qtd.
                const quantidade =
                    Number(
                        produto.qtdSelecionada ??
                        produto.qtd ??
                        produto.quantidade
                    );

                if (
                    !Number.isInteger(
                        idProduto
                    ) ||
                    idProduto <= 0
                ) {
                    throw new Error(
                        "Produto inválido."
                    );
                }

                if (
                    !Number.isFinite(
                        quantidade
                    ) ||
                    quantidade <= 0
                ) {
                    throw new Error(
                        "Quantidade de produto inválida."
                    );
                }

                const [dadosProduto] =
                    await conn.query(
                        `
                        SELECT
                            id_produto,
                            nome,
                            qtd,
                            preco
                        FROM produtos
                        WHERE id_produto = ?
                        FOR UPDATE
                        `,
                        [idProduto]
                    );

                if (
                    dadosProduto.length === 0
                ) {
                    throw new Error(
                        "Produto não encontrado."
                    );
                }

                const produtoBanco =
                    dadosProduto[0];

                const estoque =
                    Number(
                        produtoBanco.qtd
                    );

                const preco =
                    Number(
                        produtoBanco.preco
                    );

                // --------------------------------------------------
                // NÃO PERMITIR ESTOQUE ZERO
                // --------------------------------------------------

                if (estoque <= 0) {
                    throw new Error(
                        `Produto sem estoque: ${produtoBanco.nome}`
                    );
                }

                if (
                    quantidade > estoque
                ) {
                    throw new Error(
                        `Estoque insuficiente para ${produtoBanco.nome}. Disponível: ${estoque}.`
                    );
                }

                total +=
                    preco * quantidade;

                itensValidados.push({
                    id_produto:
                        idProduto,

                    qtd:
                        quantidade,

                    valor_unit:
                        preco,

                    estoque:
                        estoque,

                    nome:
                        produtoBanco.nome
                });
            }

            total =
                arredondar(total);

            // --------------------------------------------------
            // CRIAR CONTA
            // --------------------------------------------------

            const [conta] =
                await conn.query(
                    `
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
                    VALUES
                    (?, ?, ?, ?, ?, 'Pendente', FALSE)
                    `,
                    [
                        Number(id_cliente),
                        total,
                        total,
                        vencimento,
                        String(origem).trim()
                    ]
                );

            const idConta =
                conta.insertId;

            // --------------------------------------------------
            // INSERIR PRODUTOS E BAIXAR ESTOQUE
            // --------------------------------------------------

            for (
                const item
                of itensValidados
            ) {
                await conn.query(
                    `
                    INSERT INTO conta_fiado_prod
                    (
                        id_conta,
                        id_produto,
                        qtd,
                        valor_unit,
                        status_pagamento,
                        juros_ativo
                    )
                    VALUES
                    (?, ?, ?, ?, 'Pendente', FALSE)
                    `,
                    [
                        idConta,
                        item.id_produto,
                        item.qtd,
                        item.valor_unit
                    ]
                );

                const novaQtd =
                    item.estoque -
                    item.qtd;

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
            }

            await conn.commit();

            res.status(201).json({
                ok: true,
                id_conta: idConta,
                valor_original: total,
                valor_final: total
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao cadastrar conta fiado:",
                err
            );

            res.status(400).json({
                erro: err.message
            });

        } finally {
            conn.release();
        }
    }
);

/// ======================================================
// LISTAR TODAS AS CONTAS ABERTAS DE UM CLIENTE
// COM TODOS OS PRODUTOS DE CADA CONTA
// ======================================================

router.get(
    "/contas-fiado/cliente/:id_cliente",
    verificarToken,
    async (req, res) => {

        const { id_cliente } = req.params;

        try {

            // ------------------------------------------
            // Busca todas as contas abertas do cliente
            // ------------------------------------------

            const [contas] = await conexao.query(`
                SELECT
                    c.id_conta,
                    c.id_cliente,
                    c.valor_original,
                    c.valor_final,
                    c.data_vencimento,
                    c.status,
                    c.origem
                FROM contas_fiado c
                WHERE
                    c.id_cliente = ?
                    AND LOWER(TRIM(c.status)) NOT IN (
                        'finalizado',
                        'concluido',
                        'pago'
                    )
                ORDER BY c.data_vencimento ASC
            `, [id_cliente]);


            // ------------------------------------------
            // Para cada conta, busca TODOS os produtos
            // ------------------------------------------

            for (const conta of contas) {

                const [produtos] = await conexao.query(`
                    SELECT
                        cf.id_produto,
                        cf.qtd,
                        cf.valor_unit,
                        p.nome
                    FROM conta_fiado_prod cf
                    INNER JOIN produtos p
                        ON p.id_produto = cf.id_produto
                    WHERE cf.id_conta = ?
                    ORDER BY p.nome ASC
                `, [conta.id_conta]);


                conta.produtos = produtos.map(produto => ({
                    id_produto: Number(produto.id_produto),
                    nome: produto.nome,
                    quantidade: Number(produto.qtd || 0),
                    valor_unitario: Number(produto.valor_unit || 0)
                }));


                // Mantém também uma versão em texto,
                // caso alguma parte antiga do HTML use conta.produtos
                conta.produtos_texto = conta.produtos
                    .map(produto =>
                        `${produto.nome} (${produto.quantidade}x)`
                    )
                    .join(", ");
            }


            res.json(contas);

        } catch (err) {

            console.error(
                "Erro ao buscar contas do cliente:",
                err
            );

            res.status(500).json({
                erro: "Erro ao carregar as contas e produtos do cliente."
            });
        }
    }
);
router.get(
    "/contas-fiado",
    async (req, res) => {
        try {
            // --------------------------------------------------
            // ATUALIZAR STATUS AUTOMATICAMENTE
            // --------------------------------------------------

            const [ids] =
                await conexao.query(
                    `
                    SELECT id_conta
                    FROM contas_fiado
                    WHERE LOWER(
                        TRIM(
                            COALESCE(
                                status,
                                'Pendente'
                            )
                        )
                    ) <> 'Finalizado'
                    `
                );

            for (const conta of ids) {
                await atualizarStatusConta(
                    conexao,
                    Number(conta.id_conta)
                );
            }

            // --------------------------------------------------
            // CONTAS ATIVAS
            // --------------------------------------------------

            const [contas] =
                await conexao.query(
                    `
                    SELECT
                        c.id_conta,
                        c.id_cliente,
                        cl.nome_completo,
                        c.valor_original,
                        c.valor_final,
                        c.data_vencimento,
                        c.status,
                        c.origem,
                        c.juros_aplicado
                    FROM contas_fiado c
                    INNER JOIN clientes_fiado cl
                        ON cl.id_cliente =
                           c.id_cliente
                    WHERE EXISTS (
                        SELECT 1
                        FROM conta_fiado_prod cf2
                        WHERE cf2.id_conta =
                              c.id_conta
                          AND LOWER(
                                TRIM(
                                    COALESCE(
                                        cf2.status_pagamento,
                                        'Pendente'
                                    )
                                )
                              ) <> 'pago'
                    )
                    AND LOWER(
                        TRIM(
                            COALESCE(
                                c.status,
                                'Pendente'
                            )
                        )
                    ) <> 'Finalizado'
                    ORDER BY
                        c.data_vencimento ASC,
                        c.id_conta ASC
                    `
                );

            if (contas.length === 0) {
                return res.json([]);
            }

            const idsContas =
                contas.map(
                    conta =>
                        Number(
                            conta.id_conta
                        )
                );

            const placeholders =
                idsContas
                    .map(() => "?")
                    .join(",");

            // --------------------------------------------------
            // ITENS PENDENTES
            // --------------------------------------------------

            const [itens] =
                await conexao.query(
                    `
                    SELECT
                        cf.id_conta,
                        cf.id_produto,
                        cf.qtd,
                        cf.valor_unit,
                        cf.status_pagamento,
                        cf.data_pagamento,
                        cf.forma_pagamento,
                        cf.juros_ativo,
                        cf.tipo_juros,
                        cf.taxa_juros,
                        cf.valor_juros_inicio,
                        cf.data_inicio_juros,
                        p.nome
                    FROM conta_fiado_prod cf
                    INNER JOIN produtos p
                        ON p.id_produto =
                           cf.id_produto
                    WHERE cf.id_conta IN (${placeholders})
                      AND LOWER(
                            TRIM(
                                COALESCE(
                                    cf.status_pagamento,
                                    'Pendente'
                                )
                            )
                          ) <> 'pago'
                    ORDER BY
                        cf.id_conta,
                        p.nome
                    `,
                    idsContas
                );

            const mapaItens =
                new Map();

            for (const conta of contas) {
                mapaItens.set(
                    Number(conta.id_conta),
                    []
                );
            }

            for (const item of itens) {
                const idConta =
                    Number(item.id_conta);

                const valorBase =
                    Number(item.qtd || 0) *
                    Number(item.valor_unit || 0);

                const conta =
                    contas.find(
                        c =>
                            Number(
                                c.id_conta
                            ) === idConta
                    );

                const diasAtraso =
                    conta
                        ? calcularDiasAtraso(
                            conta.data_vencimento
                        )
                        : 0;

                const valorAtual =
                    calcularValorAtualItem({
                        ...item,
                        valor_base:
                            valorBase
                    });

                mapaItens
                    .get(idConta)
                    .push({
                        id_produto:
                            Number(
                                item.id_produto
                            ),

                        nome:
                            item.nome,

                        qtd:
                            Number(
                                item.qtd
                            ),

                        valor_unit:
                            Number(
                                item.valor_unit
                            ),

                        valor_base:
                            arredondar(
                                valorBase
                            ),

                        valor_atual:
                            valorAtual,

                        juros_ativo:
                            Number(
                                item.juros_ativo ||
                                0
                            ),

                        tipo_juros:
                            item.tipo_juros ||
                            null,

                        taxa_juros:
                            item.taxa_juros !== null
                                ? Number(
                                    item.taxa_juros
                                )
                                : null,

                        valor_juros_inicio:
                            item.valor_juros_inicio !== null
                                ? Number(
                                    item.valor_juros_inicio
                                )
                                : null,

                        data_inicio_juros:
                            item.data_inicio_juros ||
                            null,

                        data_pagamento:
                            item.data_pagamento ||
                            null,

                        forma_pagamento:
                            item.forma_pagamento ||
                            null,

                        dias_atraso:
                            diasAtraso
                    });
            }

            // --------------------------------------------------
            // MONTAR RESPOSTA
            // --------------------------------------------------

            const resposta =
                contas.map(conta => {
                    const itensConta =
                        mapaItens.get(
                            Number(
                                conta.id_conta
                            )
                        ) || [];

                    const valorOriginal =
                        arredondar(
                            itensConta.reduce(
                                (
                                    total,
                                    item
                                ) =>
                                    total +
                                    Number(
                                        item.valor_base ||
                                        0
                                    ),
                                0
                            )
                        );

                    const valorFinal =
                        arredondar(
                            itensConta.reduce(
                                (
                                    total,
                                    item
                                ) =>
                                    total +
                                    Number(
                                        item.valor_atual ||
                                        0
                                    ),
                                0
                            )
                        );

                    const diasAtraso =
                        itensConta.reduce(
                            (
                                maior,
                                item
                            ) =>
                                Math.max(
                                    maior,
                                    Number(
                                        item.dias_atraso ||
                                        0
                                    )
                                ),
                            0
                        );

                    return {
                        id_conta:
                            Number(
                                conta.id_conta
                            ),

                        id_cliente:
                            Number(
                                conta.id_cliente
                            ),

                        nome_completo:
                            conta.nome_completo,

                        valor_original:
                            valorOriginal,

                        valor_final:
                            valorFinal,

                        data_vencimento:
                            conta.data_vencimento,

                        status:
                            conta.status,

                        origem:
                            conta.origem,

                        juros_aplicado:
                            Number(
                                conta.juros_aplicado ||
                                0
                            ),

                        dias_atraso:
                            diasAtraso,

                        itens:
                            itensConta
                    };
                });

            res.json(resposta);

        } catch (err) {
            console.error(
                "Erro ao listar contas fiado:",
                err
            );

            res.status(500).json({
                erro: err.message
            });
        }
    }
);

// ======================================================
// SIMULAR JUROS
// ======================================================
//
// NÃO ALTERA O BANCO.
//
// Calcula juros desde o vencimento até hoje.
//
// ======================================================

router.post(
    "/contas-fiado/simular-juros",
    async (req, res) => {
        const {
            itens,
            tipo_juros,
            taxa_juros
        } = req.body;

        try {
            const tipo =
                normalizarTipoJuros(
                    tipo_juros
                );

            const taxa =
                validarTaxa(
                    taxa_juros
                );

            if (
                !Array.isArray(itens) ||
                itens.length === 0
            ) {
                return res.status(400).json({
                    erro:
                        "Selecione pelo menos um produto."
                });
            }

            const resultados = [];

            for (
                const selecionado
                of itens
            ) {
                const idConta =
                    Number(
                        selecionado.id_conta
                    );

                const idProduto =
                    Number(
                        selecionado.id_produto
                    );

                if (
                    !Number.isInteger(
                        idConta
                    ) ||
                    idConta <= 0 ||
                    !Number.isInteger(
                        idProduto
                    ) ||
                    idProduto <= 0
                ) {
                    throw new Error(
                        "Produto selecionado inválido."
                    );
                }

                const [dados] =
                    await conexao.query(
                        `
                        SELECT
                            cf.id_conta,
                            cf.id_produto,
                            cf.qtd,
                            cf.valor_unit,
                            cf.status_pagamento,
                            cf.juros_ativo,
                            p.nome,
                            c.data_vencimento
                        FROM conta_fiado_prod cf
                        INNER JOIN contas_fiado c
                            ON c.id_conta =
                               cf.id_conta
                        INNER JOIN produtos p
                            ON p.id_produto =
                               cf.id_produto
                        WHERE cf.id_conta = ?
                          AND cf.id_produto = ?
                        LIMIT 1
                        `,
                        [
                            idConta,
                            idProduto
                        ]
                    );

                if (dados.length === 0) {
                    throw new Error(
                        "Produto não encontrado na conta."
                    );
                }

                const item =
                    dados[0];

                if (
                    String(
                        item.status_pagamento ||
                        "Pendente"
                    )
                        .trim()
                        .toLowerCase() ===
                    "pago"
                ) {
                    throw new Error(
                        `O produto ${item.nome} já foi pago.`
                    );
                }

                if (
                    Number(
                        item.juros_ativo
                    ) === 1
                ) {
                    throw new Error(
                        `O produto ${item.nome} já possui juros ativos.`
                    );
                }

                const diasAtraso =
                    calcularDiasAtraso(
                        item.data_vencimento
                    );

                if (diasAtraso <= 0) {
                    throw new Error(
                        `O produto ${item.nome} ainda não está atrasado.`
                    );
                }

                const valorBase =
                    Number(item.qtd || 0) *
                    Number(item.valor_unit || 0);

                const valorSimulado =
                    calcularJurosSimples(
                        valorBase,
                        taxa,
                        tipo,
                        diasAtraso
                    );

                const valorJuros =
                    valorSimulado -
                    valorBase;

                resultados.push({
                    id_conta:
                        idConta,

                    id_produto:
                        idProduto,

                    nome:
                        item.nome,

                    qtd:
                        Number(
                            item.qtd
                        ),

                    valor_base:
                        arredondar(
                            valorBase
                        ),

                    dias_atraso:
                        diasAtraso,

                    valor_juros:
                        arredondar(
                            valorJuros
                        ),

                    valor_simulado:
                        arredondar(
                            valorSimulado
                        )
                });
            }

            const totalOriginal =
                resultados.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.valor_base ||
                            0
                        ),
                    0
                );

            const totalJuros =
                resultados.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.valor_juros ||
                            0
                        ),
                    0
                );

            const totalSimulado =
                resultados.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.valor_simulado ||
                            0
                        ),
                    0
                );

            res.json({
                tipo_juros:
                    tipo,

                taxa_juros:
                    taxa,

                itens:
                    resultados,

                total_original:
                    arredondar(
                        totalOriginal
                    ),

                total_juros:
                    arredondar(
                        totalJuros
                    ),

                total_simulado:
                    arredondar(
                        totalSimulado
                    )
            });

        } catch (err) {
            console.error(
                "Erro ao simular juros:",
                err
            );

            res.status(400).json({
                erro: err.message
            });
        }
    }
);

// ======================================================
// APLICAR JUROS
// ======================================================
//
// A simulação é salva como valor_juros_inicio.
//
// A partir de data_inicio_juros os juros continuam
// aumentando automaticamente.
//
// ======================================================

router.put(
    "/contas-fiado/aplicar-juros",
    async (req, res) => {
        const {
            itens,
            tipo_juros,
            taxa_juros
        } = req.body;

        const conn =
            await conexao.getConnection();

        try {
            const tipo =
                normalizarTipoJuros(
                    tipo_juros
                );

            const taxa =
                validarTaxa(
                    taxa_juros
                );

            if (
                !Array.isArray(itens) ||
                itens.length === 0
            ) {
                throw new Error(
                    "Nenhum produto selecionado."
                );
            }

            await conn.beginTransaction();

            const dataInicio =
                dataHojeISO();

            const contasAlteradas =
                new Set();

            for (
                const selecionado
                of itens
            ) {
                const idConta =
                    Number(
                        selecionado.id_conta
                    );

                const idProduto =
                    Number(
                        selecionado.id_produto
                    );

                const [dados] =
                    await conn.query(
                        `
                        SELECT
                            cf.id_conta,
                            cf.id_produto,
                            cf.qtd,
                            cf.valor_unit,
                            cf.status_pagamento,
                            cf.juros_ativo,
                            p.nome,
                            c.data_vencimento
                        FROM conta_fiado_prod cf
                        INNER JOIN contas_fiado c
                            ON c.id_conta =
                               cf.id_conta
                        INNER JOIN produtos p
                            ON p.id_produto =
                               cf.id_produto
                        WHERE cf.id_conta = ?
                          AND cf.id_produto = ?
                        FOR UPDATE
                        `,
                        [
                            idConta,
                            idProduto
                        ]
                    );

                if (dados.length === 0) {
                    throw new Error(
                        "Produto não encontrado na conta."
                    );
                }

                const item =
                    dados[0];

                if (
                    String(
                        item.status_pagamento ||
                        "Pendente"
                    )
                        .trim()
                        .toLowerCase() ===
                    "pago"
                ) {
                    throw new Error(
                        `O produto ${item.nome} já foi pago.`
                    );
                }

                if (
                    Number(
                        item.juros_ativo
                    ) === 1
                ) {
                    throw new Error(
                        `O produto ${item.nome} já possui juros ativos.`
                    );
                }

                const diasAtraso =
                    calcularDiasAtraso(
                        item.data_vencimento
                    );

                if (diasAtraso <= 0) {
                    throw new Error(
                        `O produto ${item.nome} não está atrasado.`
                    );
                }

                const valorBase =
                    Number(item.qtd || 0) *
                    Number(item.valor_unit || 0);

                const valorSimulado =
                    calcularJurosSimples(
                        valorBase,
                        taxa,
                        tipo,
                        diasAtraso
                    );

                // --------------------------------------------------
                // SALVAR JUROS
                // --------------------------------------------------

                await conn.query(
                    `
                    UPDATE conta_fiado_prod
                    SET
                        juros_ativo = TRUE,
                        tipo_juros = ?,
                        taxa_juros = ?,
                        valor_juros_inicio = ?,
                        data_inicio_juros = ?
                    WHERE id_conta = ?
                      AND id_produto = ?
                    `,
                    [
                        tipo,
                        taxa,
                        arredondar(
                            valorSimulado
                        ),
                        dataInicio,
                        idConta,
                        idProduto
                    ]
                );

                contasAlteradas.add(
                    idConta
                );
            }

            // --------------------------------------------------
            // ATUALIZAR CONTAS
            // --------------------------------------------------

            for (
                const idConta
                of contasAlteradas
            ) {
                await atualizarStatusConta(
                    conn,
                    idConta
                );

                await conn.query(
                    `
                    UPDATE contas_fiado
                    SET juros_aplicado = TRUE
                    WHERE id_conta = ?
                    `,
                    [idConta]
                );
            }

            await conn.commit();

            res.json({
                ok: true,

                mensagem:
                    "Juros aplicados com sucesso. A contagem continuará automaticamente até o pagamento."
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao aplicar juros:",
                err
            );

            res.status(400).json({
                erro: err.message
            });

        } finally {
            conn.release();
        }
    }
);

// ======================================================
// PAGAR PRODUTO INDIVIDUALMENTE
// ======================================================
//
// Marca somente aquele produto como pago.
//
// Se ainda houver produtos pendentes:
//      conta continua aberta.
//
// Se for o último produto:
//      conta vira Finalizado
//      histórico é criado.
//
// ======================================================

router.put(
    "/contas-fiado/item/:idConta/:idProduto/pagar",
    async (req, res) => {
        const idConta =
            Number(
                req.params.idConta
            );

        const idProduto =
            Number(
                req.params.idProduto
            );

        const {
            data_pagamento,
            forma_pagamento
        } = req.body;

        if (
            !Number.isInteger(idConta) ||
            idConta <= 0
        ) {
            return res.status(400).json({
                erro:
                    "Conta inválida."
            });
        }

        if (
            !Number.isInteger(idProduto) ||
            idProduto <= 0
        ) {
            return res.status(400).json({
                erro:
                    "Produto inválido."
            });
        }

        if (!data_pagamento) {
            return res.status(400).json({
                erro:
                    "Data do pagamento não informada."
            });
        }

        if (
            !forma_pagamento ||
            !String(
                forma_pagamento
            ).trim()
        ) {
            return res.status(400).json({
                erro:
                    "Forma de pagamento não informada."
            });
        }

        const conn =
            await conexao.getConnection();

        try {
            await conn.beginTransaction();

            // --------------------------------------------------
            // BUSCAR ITEM
            // --------------------------------------------------

            const [itens] =
                await conn.query(
                    `
                    SELECT
                        cf.id_conta,
                        cf.id_produto,
                        cf.status_pagamento,
                        cf.qtd,
                        cf.valor_unit,
                        cf.juros_ativo,
                        cf.tipo_juros,
                        cf.taxa_juros,
                        cf.valor_juros_inicio,
                        cf.data_inicio_juros,
                        p.nome
                    FROM conta_fiado_prod cf
                    INNER JOIN produtos p
                        ON p.id_produto =
                           cf.id_produto
                    WHERE cf.id_conta = ?
                      AND cf.id_produto = ?
                    FOR UPDATE
                    `,
                    [
                        idConta,
                        idProduto
                    ]
                );

            if (itens.length === 0) {
                throw new Error(
                    "Produto não encontrado nessa conta."
                );
            }

            const item =
                itens[0];

            if (
                String(
                    item.status_pagamento ||
                    "Pendente"
                )
                    .trim()
                    .toLowerCase() ===
                "pago"
            ) {
                throw new Error(
                    "Esse produto já foi pago."
                );
            }

            // --------------------------------------------------
            // CALCULAR VALOR FINAL DO ITEM
            // --------------------------------------------------

            const valorBase =
                Number(item.qtd || 0) *
                Number(item.valor_unit || 0);

            const valorAtual =
                calcularValorAtualItem({
                    ...item,
                    valor_base:
                        valorBase
                });

            // --------------------------------------------------
            // PAGAR ITEM
            // --------------------------------------------------

            await conn.query(
                `
                UPDATE conta_fiado_prod
                SET
                    status_pagamento = 'Pago',
                    data_pagamento = ?,
                    forma_pagamento = ?,
                    juros_ativo = FALSE
                WHERE id_conta = ?
                  AND id_produto = ?
                `,
                [
                    data_pagamento,
                    String(
                        forma_pagamento
                    ).trim(),
                    idConta,
                    idProduto
                ]
            );

            // --------------------------------------------------
            // VERIFICAR SE ACABARAM OS PENDENTES
            // --------------------------------------------------

            const status =
                await atualizarStatusConta(
                    conn,
                    idConta
                );

            let historico = null;

            if (status === "Finalizado") {
                historico =
                    await criarHistoricoConta(
                        conn,
                        idConta,
                        data_pagamento,
                        forma_pagamento
                    );
            }

            await conn.commit();

            res.json({
                ok: true,

                mensagem:
                    `${item.nome} foi marcado como pago.`,

                valor_pago:
                    valorAtual,

                status_conta:
                    status,

                finalizado:
                    status === "Finalizado",

                id_pedido:
                    historico?.id_pedido ||
                    null,

                num_pedido:
                    historico?.num_pedido ||
                    null
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao pagar item do fiado:",
                err
            );

            res.status(400).json({
                erro: err.message
            });

        } finally {
            conn.release();
        }
    }
);

// ======================================================
// FINALIZAR CONTA INTEIRA
// ======================================================
//
// Compatibilidade com o botão "Finalizar conta".
//
// Todos os produtos pendentes são pagos de uma vez.
// Depois cria o histórico.
//
// ======================================================

router.put(
    "/contas-fiado/:id/finalizar",
    async (req, res) => {
        const idConta =
            Number(req.params.id);

        const {
            data_conclusao,
            forma_pagamento
        } = req.body;

        if (
            !Number.isInteger(idConta) ||
            idConta <= 0
        ) {
            return res.status(400).json({
                erro:
                    "Conta inválida."
            });
        }

        if (!data_conclusao) {
            return res.status(400).json({
                erro:
                    "Data de conclusão não informada."
            });
        }

        if (
            !forma_pagamento ||
            !String(
                forma_pagamento
            ).trim()
        ) {
            return res.status(400).json({
                erro:
                    "Forma de pagamento não informada."
            });
        }

        const conn =
            await conexao.getConnection();

        try {
            await conn.beginTransaction();

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
                        data_vencimento,
                        origem,
                        status
                    FROM contas_fiado
                    WHERE id_conta = ?
                    FOR UPDATE
                    `,
                    [idConta]
                );

            if (contas.length === 0) {
                throw new Error(
                    "Conta fiado não encontrada."
                );
            }

            const conta =
                contas[0];

            const statusAtual =
                String(
                    conta.status || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                statusAtual ===
                    "finalizado"
            ) {
                throw new Error(
                    "Esta conta já foi finalizada."
                );
            }

            // --------------------------------------------------
            // VERIFICAR PRODUTOS
            // --------------------------------------------------

            const [itens] =
                await conn.query(
                    `
                    SELECT
                        cf.id_produto,
                        cf.qtd,
                        cf.valor_unit,
                        cf.status_pagamento,
                        cf.juros_ativo,
                        cf.tipo_juros,
                        cf.taxa_juros,
                        cf.valor_juros_inicio,
                        cf.data_inicio_juros,
                        p.nome
                    FROM conta_fiado_prod cf
                    INNER JOIN produtos p
                        ON p.id_produto =
                           cf.id_produto
                    WHERE cf.id_conta = ?
                    FOR UPDATE
                    `,
                    [idConta]
                );

            if (itens.length === 0) {
                throw new Error(
                    "Esta conta não possui produtos."
                );
            }

            // --------------------------------------------------
            // MARCAR PENDENTES COMO PAGOS
            // --------------------------------------------------

            await conn.query(
                `
                UPDATE conta_fiado_prod
                SET
                    status_pagamento = 'Pago',
                    data_pagamento = ?,
                    forma_pagamento = ?,
                    juros_ativo = FALSE
                WHERE id_conta = ?
                  AND LOWER(
                        TRIM(
                            COALESCE(
                                status_pagamento,
                                'Pendente'
                            )
                        )
                      ) <> 'pago'
                `,
                [
                    data_conclusao,
                    String(
                        forma_pagamento
                    ).trim(),
                    idConta
                ]
            );

            // --------------------------------------------------
            // CRIAR HISTÓRICO
            // --------------------------------------------------

            const historico =
                await criarHistoricoConta(
                    conn,
                    idConta,
                    data_conclusao,
                    forma_pagamento
                );

            if (!historico) {
                throw new Error(
                    "Não foi possível finalizar a conta."
                );
            }

            await conn.commit();

            res.json({
                ok: true,

                sucesso: true,

                mensagem:
                    "Conta fiado finalizada com sucesso.",

                id_pedido:
                    historico.id_pedido,

                num_pedido:
                    historico.num_pedido
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao finalizar conta fiado:",
                err
            );

            res.status(400).json({
                sucesso: false,
                erro: err.message
            });

        } finally {
            conn.release();
        }
    }
);

// ======================================================
// EXPORTAR
// ======================================================

module.exports = router;
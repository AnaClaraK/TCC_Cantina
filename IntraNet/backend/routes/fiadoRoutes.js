const express = require("express");

const router = express.Router();
const conexao = require("../db");
const verificarToken =
    require("../middlewares/auth");

/* ======================================================
   FUNÇÕES AUXILIARES
====================================================== */

/*
    Converte corretamente qualquer formato de data
    que possa vir do MySQL ou do frontend.

    Aceita:
    - Date
    - YYYY-MM-DD
    - YYYY-MM-DD HH:mm:ss
    - ISO
*/
function normalizarDataTexto(valor) {
    if (!valor) return null;

    if (valor instanceof Date) {
        if (Number.isNaN(valor.getTime())) {
            return null;
        }

        const ano = valor.getFullYear();
        const mes = String(
            valor.getMonth() + 1
        ).padStart(2, "0");
        const dia = String(
            valor.getDate()
        ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    const texto = String(valor).trim();

    /*
        Primeiro tenta YYYY-MM-DD.
    */
    const match =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }

    /*
        Caso venha como data textual.
    */
    const data = new Date(texto);

    if (Number.isNaN(data.getTime())) {
        return null;
    }

    const ano = data.getFullYear();
    const mes = String(
        data.getMonth() + 1
    ).padStart(2, "0");
    const dia = String(
        data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


function dataSomenteLocal(valor) {
    const texto =
        normalizarDataTexto(valor);

    if (!texto) return null;

    const partes =
        texto.split("-");

    if (partes.length !== 3) {
        return null;
    }

    const ano =
        Number(partes[0]);

    const mes =
        Number(partes[1]);

    const dia =
        Number(partes[2]);

    if (
        !Number.isInteger(ano) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(dia)
    ) {
        return null;
    }

    const data =
        new Date(
            ano,
            mes - 1,
            dia
        );

    /*
        Impede datas como 2026-02-31
        de serem aceitas pelo JavaScript.
    */
    if (
        data.getFullYear() !== ano ||
        data.getMonth() !== mes - 1 ||
        data.getDate() !== dia
    ) {
        return null;
    }

    return data;
}


function normalizarTipoJuros(tipo) {
    return String(tipo || "")
        .toLowerCase() === "mes"
        ? "mes"
        : "dia";
}


function validarTaxa(taxa) {
    if (
        taxa === undefined ||
        taxa === null ||
        String(taxa).trim() === ""
    ) {
        throw new Error(
            "Informe a porcentagem de juros."
        );
    }

    const texto =
        String(taxa)
            .trim()
            .replace(/%/g, "")
            .replace(/\s/g, "")
            .replace(",", ".");

    const valor =
        Number(texto);

    if (
        !Number.isFinite(valor) ||
        valor < 0 ||
        valor > 1000
    ) {
        throw new Error(
            "A porcentagem de juros é inválida. Informe um valor entre 0% e 1000%."
        );
    }

    return valor;
}


function arredondar(valor) {
    return Math.round(
        (Number(valor) + Number.EPSILON) * 100
    ) / 100;
}


function calcularDiasAtraso(
    dataVencimento
) {
    const vencimento =
        dataSomenteLocal(
            dataVencimento
        );

    if (!vencimento) {
        return 0;
    }

    const hoje =
        new Date();

    const hojeSemHora =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate()
        );

    return Math.max(
        0,
        Math.floor(
            (
                hojeSemHora -
                vencimento
            ) / 86400000
        )
    );
}


/* ======================================================
   STATUS DA CONTA

   O banco aparentemente não aceita "Finalizado".
   Esta função verifica o ENUM da coluna e escolhe
   automaticamente um status aceito.

   Se existir "Finalizado", usa ele.
   Caso contrário, tenta "Pago".
   Depois "Concluído".
====================================================== */

let cacheStatusContasFiado = null;

async function obterStatusPermitidos(conn) {
    if (cacheStatusContasFiado) {
        return cacheStatusContasFiado;
    }

    const [colunas] =
        await conn.query(
            `
            SHOW COLUMNS
            FROM contas_fiado
            LIKE 'status'
            `
        );

    if (
        !colunas ||
        colunas.length === 0
    ) {
        throw new Error(
            "A coluna status da tabela contas_fiado não foi encontrada."
        );
    }

    const tipo =
        String(
            colunas[0].Type || ""
        );

    const encontrados = [];

    const regex =
        /'((?:[^'\\\\]|\\\\.)*)'/g;

    let match;

    while (
        (match = regex.exec(tipo)) !== null
    ) {
        encontrados.push(
            match[1]
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, "\\")
        );
    }

    cacheStatusContasFiado =
        encontrados;

    return encontrados;
}


async function obterStatusFinalizado(conn) {
    const permitidos =
        await obterStatusPermitidos(
            conn
        );

    const candidatos = [
        "Finalizado",
        "Pago",
        "Concluído",
        "Concluido"
    ];

    const encontrado =
        candidatos.find(
            status =>
                permitidos.some(
                    permitido =>
                        String(
                            permitido
                        ).toLowerCase() ===
                        status.toLowerCase()
                )
        );

    if (encontrado) {
        return permitidos.find(
            permitido =>
                String(
                    permitido
                ).toLowerCase() ===
                encontrado.toLowerCase()
        );
    }

    /*
        Se não for ENUM ou o banco não
        devolver os valores, tenta Pago,
        que representa uma conta totalmente paga.
    */
    return "Pago";
}


async function obterStatusAtrasado(conn) {
    const permitidos =
        await obterStatusPermitidos(
            conn
        );

    const encontrado =
        permitidos.find(
            status =>
                String(
                    status
                ).toLowerCase() ===
                "atrasado"
        );

    /*
        Se o banco tiver Atrasado, usa.
        Se não tiver, mantém Pendente para
        não gerar erro no banco.
    */
    return encontrado || "Pendente";
}


async function obterStatusPendente(conn) {
    const permitidos =
        await obterStatusPermitidos(
            conn
        );

    const encontrado =
        permitidos.find(
            status =>
                String(
                    status
                ).toLowerCase() ===
                "pendente"
        );

    return encontrado || "Pendente";
}


/* ======================================================
   JUROS SIMPLES
====================================================== */

function calcularJurosSimples(
    valorBase,
    taxa,
    tipo,
    dias
) {
    const valor =
        Number(valorBase) || 0;

    const percentual =
        Number(taxa) || 0;

    const quantidadeDias =
        Math.max(
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


/* ======================================================
   VALOR ATUAL DO ITEM COM JUROS
====================================================== */

function calcularValorAtualItem(item) {
    const valorBase =
        Number(
            item.valor_base || 0
        );

    if (
        Number(item.juros_ativo) !== 1
    ) {
        return arredondar(
            valorBase
        );
    }

    const taxa =
        Number(
            item.taxa_juros || 0
        );

    const tipo =
        normalizarTipoJuros(
            item.tipo_juros
        );

    const valorInicial =
        Number(
            item.valor_juros_inicio ||
            valorBase
        );

    const dataInicio =
        dataSomenteLocal(
            item.data_inicio_juros
        ) ||
        dataSomenteLocal(
            item.data_vencimento
        );

    if (!dataInicio) {
        return arredondar(
            valorBase
        );
    }

    const hoje =
        new Date();

    const hojeSemHora =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate()
        );

    const inicioSemHora =
        new Date(
            dataInicio.getFullYear(),
            dataInicio.getMonth(),
            dataInicio.getDate()
        );

    const dias =
        Math.max(
            0,
            Math.floor(
                (
                    hojeSemHora -
                    inicioSemHora
                ) / 86400000
            )
        );

    return arredondar(
        calcularJurosSimples(
            valorInicial,
            taxa,
            tipo,
            dias
        )
    );
}


/* ======================================================
   ATUALIZAR STATUS DA CONTA
====================================================== */

async function atualizarStatusConta(
    conn,
    idConta
) {
    const [pendentes] =
        await conn.query(
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

    const quantidadePendente =
        Number(
            pendentes[0]?.quantidade || 0
        );

    /*
        Não existem mais produtos pendentes.
        A conta está totalmente paga.
    */
    if (
        quantidadePendente === 0
    ) {
        const statusFinal =
            await obterStatusFinalizado(
                conn
            );

        await conn.query(
            `
            UPDATE contas_fiado
            SET status = ?
            WHERE id_conta = ?
            `,
            [
                statusFinal,
                idConta
            ]
        );

        return statusFinal;
    }

    const [conta] =
        await conn.query(
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
        const statusAtrasado =
            await obterStatusAtrasado(
                conn
            );

        await conn.query(
            `
            UPDATE contas_fiado
            SET status = ?
            WHERE id_conta = ?
            `,
            [
                statusAtrasado,
                idConta
            ]
        );

        return statusAtrasado;
    }

    const statusPendente =
        await obterStatusPendente(
            conn
        );

    await conn.query(
        `
        UPDATE contas_fiado
        SET status = ?
        WHERE id_conta = ?
        `,
        [
            statusPendente,
            idConta
        ]
    );

    return statusPendente;
}


/* ======================================================
   CLIENTES FIADO
====================================================== */

router.post(
    "/clientes-fiado",
    verificarToken,
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
                    ? String(
                        endereco
                    ).trim()
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

            if (
                cpf.length !== 11
            ) {
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

            res.json({
                sucesso: true
            });

        } catch (err) {
            console.error(
                "Erro ao cadastrar cliente:",
                err
            );

            res.status(500).json({
                erro: err.message
            });
        }
    }
);


router.get(
    "/clientes-fiado",
    verificarToken,
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
                "Erro ao listar clientes:",
                err
            );

            res.status(500).json({
                erro: err.message
            });
        }
    }
);


/* ======================================================
   CLIENTES COM CONTAS PENDENTES
====================================================== */

router.get(
    "/clientes-fiado/pendentes",
    verificarToken,
    async (req, res) => {
        try {
            const [dados] =
                await conexao.query(
                    `
                    SELECT DISTINCT
                        cl.id_cliente,
                        cl.nome_completo,
                        cl.cpf,
                        cl.telefone
                    FROM clientes_fiado cl
                    INNER JOIN contas_fiado c
                        ON c.id_cliente =
                           cl.id_cliente
                    INNER JOIN conta_fiado_prod cf
                        ON cf.id_conta =
                           c.id_conta
                    WHERE LOWER(
                              TRIM(
                                  COALESCE(
                                      cf.status_pagamento,
                                      'Pendente'
                                  )
                              )
                          ) <> 'pago'
                    ORDER BY
                        cl.nome_completo
                    `
                );

            res.json(dados);

        } catch (err) {
            console.error(
                "Erro ao listar clientes pendentes:",
                err
            );

            res.status(500).json({
                erro: err.message
            });
        }
    }
);


/* ======================================================
   CRIAR CONTA FIADO
====================================================== */

router.post(
    "/contas-fiado",
    verificarToken,
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

            const [cliente] =
                await conn.query(
                    `
                    SELECT id_cliente
                    FROM clientes_fiado
                    WHERE id_cliente = ?
                    `,
                    [id_cliente]
                );

            if (
                cliente.length === 0
            ) {
                throw new Error(
                    "Cliente não encontrado."
                );
            }

            let total = 0;

            const itensValidados = [];

            for (
                const produto
                of produtos
            ) {
                const idProduto =
                    Number(
                        produto.id_produto
                    );

                const quantidade =
                    Number(
                        produto.qtdSelecionada
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

                if (
                    estoque <= 0
                ) {
                    throw new Error(
                        `Produto sem estoque: ${produtoBanco.nome}`
                    );
                }

                if (
                    quantidade > estoque
                ) {
                    throw new Error(
                        `Estoque insuficiente para ${produtoBanco.nome}`
                    );
                }

                total +=
                    preco *
                    quantidade;

                itensValidados.push({
                    id_produto:
                        idProduto,
                    qtd:
                        quantidade,
                    valor_unit:
                        preco
                });
            }

            total =
                arredondar(total);

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
                    VALUES (
                        ?, ?, ?, ?, ?,
                        'Pendente',
                        FALSE
                    )
                    `,
                    [
                        id_cliente,
                        total,
                        total,
                        vencimento,
                        String(
                            origem
                        ).trim()
                    ]
                );

            const idConta =
                conta.insertId;

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
                    VALUES (
                        ?, ?, ?, ?,
                        'Pendente',
                        FALSE
                    )
                    `,
                    [
                        idConta,
                        item.id_produto,
                        item.qtd,
                        item.valor_unit
                    ]
                );
            }

            await conn.commit();

            res.json({
                ok: true,
                id_conta:
                    idConta
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao criar conta fiado:",
                err
            );

            res.status(500).json({
                erro: err.message
            });

        } finally {
            conn.release();
        }
    }
);


/* ======================================================
   LISTAR CONTAS FIADO
====================================================== */

router.get(
    "/contas-fiado",
    verificarToken,
    async (req, res) => {
        try {
            const [contas] =
                await conexao.query(
                    `
                    SELECT
                        c.id_conta,
                        c.id_cliente,
                        cl.nome_completo,
                        c.valor_original,
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
                    ORDER BY
                        c.data_vencimento ASC,
                        c.id_conta ASC
                    `
                );

            if (
                contas.length === 0
            ) {
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

            const [itens] =
                await conexao.query(
                    `
                    SELECT
                        cf.id_conta,
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
                    WHERE cf.id_conta IN (
                        ${placeholders}
                    )
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

            for (
                const conta
                of contas
            ) {
                mapaItens.set(
                    Number(
                        conta.id_conta
                    ),
                    []
                );
            }

            for (
                const item
                of itens
            ) {
                const idConta =
                    Number(
                        item.id_conta
                    );

                const conta =
                    contas.find(
                        c =>
                            Number(
                                c.id_conta
                            ) === idConta
                    );

                const valorBase =
                    Number(
                        item.qtd || 0
                    ) *
                    Number(
                        item.valor_unit || 0
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
                            valorBase,
                        data_vencimento:
                            conta?.data_vencimento
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
                                item.juros_ativo || 0
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
                        data_inicio_juros:
                            item.data_inicio_juros ||
                            null,
                        dias_atraso:
                            diasAtraso,
                        data_vencimento:
                            conta?.data_vencimento ||
                            null,
                        status_pagamento:
                            item.status_pagamento ||
                            "Pendente"
                    });
            }

            const resposta =
                contas.map(
                    conta => {
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
                                            item.valor_base || 0
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
                                            item.valor_atual || 0
                                        ),
                                    0
                                )
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
                                    conta.juros_aplicado || 0
                                ),
                            dias_atraso:
                                calcularDiasAtraso(
                                    conta.data_vencimento
                                ),
                            itens:
                                itensConta,
                            produtos:
                                itensConta
                        };
                    }
                );

            res.json(resposta);

        } catch (err) {
            console.error(
                "Erro ao listar contas fiado:",
                err
            );

            res.status(500).json({
                erro:
                    err.message
            });
        }
    }
);


/* ======================================================
   CONTAS DE UM CLIENTE
====================================================== */

router.get(
    "/contas-fiado/cliente/:id",
    verificarToken,
    async (req, res) => {
        let conn;

        try {
            const idCliente =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(
                    idCliente
                ) ||
                idCliente <= 0
            ) {
                return res.status(400).json({
                    erro:
                        "Cliente inválido."
                });
            }

            conn =
                await conexao.getConnection();

            const [contas] =
                await conn.query(
                    `
                    SELECT
                        c.id_conta,
                        c.id_cliente,
                        cl.nome_completo,
                        c.valor_original,
                        c.data_vencimento,
                        c.status,
                        c.origem,
                        c.juros_aplicado
                    FROM contas_fiado c
                    INNER JOIN clientes_fiado cl
                        ON cl.id_cliente =
                           c.id_cliente
                    WHERE c.id_cliente = ?
                      AND EXISTS (
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
                    ORDER BY
                        c.data_vencimento ASC,
                        c.id_conta ASC
                    `,
                    [idCliente]
                );

            if (
                contas.length === 0
            ) {
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

            const [itens] =
                await conn.query(
                    `
                    SELECT
                        cf.id_conta,
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
                    WHERE cf.id_conta IN (
                        ${placeholders}
                    )
                    AND LOWER(
                        TRIM(
                            COALESCE(
                                cf.status_pagamento,
                                'Pendente'
                            )
                        )
                    ) <> 'pago'
                    ORDER BY
                        cf.id_conta ASC,
                        p.nome ASC
                    `,
                    idsContas
                );

            const mapa =
                new Map();

            for (
                const conta
                of contas
            ) {
                mapa.set(
                    Number(
                        conta.id_conta
                    ),
                    []
                );
            }

            for (
                const item
                of itens
            ) {
                const idConta =
                    Number(
                        item.id_conta
                    );

                const conta =
                    contas.find(
                        c =>
                            Number(
                                c.id_conta
                            ) === idConta
                    );

                const valorBase =
                    Number(
                        item.qtd || 0
                    ) *
                    Number(
                        item.valor_unit || 0
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
                            valorBase,
                        data_vencimento:
                            conta?.data_vencimento
                    });

                mapa
                    .get(idConta)
                    .push({
                        id_produto:
                            Number(
                                item.id_produto
                            ),
                        nome:
                            item.nome ||
                            "Produto",
                        qtd:
                            Number(
                                item.qtd || 0
                            ),
                        valor_unit:
                            Number(
                                item.valor_unit || 0
                            ),
                        valor_base:
                            arredondar(
                                valorBase
                            ),
                        valor_atual:
                            valorAtual,
                        juros_ativo:
                            Number(
                                item.juros_ativo || 0
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
                        data_inicio_juros:
                            item.data_inicio_juros ||
                            null,
                        dias_atraso:
                            diasAtraso,
                        data_vencimento:
                            conta?.data_vencimento ||
                            null,
                        status_pagamento:
                            item.status_pagamento ||
                            "Pendente"
                    });
            }

            const resposta =
                contas.map(
                    conta => {
                        const itensConta =
                            mapa.get(
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
                                            item.valor_base || 0
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
                                            item.valor_atual || 0
                                        ),
                                    0
                                )
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
                                    conta.juros_aplicado || 0
                                ),
                            dias_atraso:
                                calcularDiasAtraso(
                                    conta.data_vencimento
                                ),
                            itens:
                                itensConta,
                            produtos:
                                itensConta
                        };
                    }
                );

            res.json(resposta);

        } catch (err) {
            console.error(
                "Erro ao listar contas do cliente:",
                err
            );

            res.status(500).json({
                erro:
                    "Não foi possível carregar as contas deste cliente.",
                detalhe:
                    err.code ||
                    err.message
            });

        } finally {
            if (conn) {
                try {
                    conn.release();
                } catch (e) {
                    console.error(
                        "Erro ao liberar conexão:",
                        e
                    );
                }
            }
        }
    }
);


/* ======================================================
   SIMULAR JUROS
====================================================== */

router.post(
    "/contas-fiado/simular-juros",
    verificarToken,
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
                    !Number.isInteger(
                        idProduto
                    )
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

                if (
                    dados.length === 0
                ) {
                    throw new Error(
                        `Produto ${idProduto} não encontrado na conta ${idConta}.`
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

                if (
                    diasAtraso <= 0
                ) {
                    throw new Error(
                        `O produto ${item.nome} ainda não está atrasado.`
                    );
                }

                const valorBase =
                    Number(
                        item.qtd || 0
                    ) *
                    Number(
                        item.valor_unit || 0
                    );

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
                    data_vencimento:
                        normalizarDataTexto(
                            item.data_vencimento
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
                            item.valor_base || 0
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
                            item.valor_juros || 0
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
                            item.valor_simulado || 0
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
                erro:
                    err.message
            });
        }
    }
);


/* ======================================================
   APLICAR JUROS
====================================================== */

async function aplicarJuros(
    req,
    res
) {
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

            if (
                dados.length === 0
            ) {
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

            const dataVencimento =
                normalizarDataTexto(
                    item.data_vencimento
                );

            if (!dataVencimento) {
                throw new Error(
                    `Data de vencimento inválida para o produto "${item.nome}".`
                );
            }

            const diasAtraso =
                calcularDiasAtraso(
                    dataVencimento
                );

            if (
                diasAtraso <= 0
            ) {
                throw new Error(
                    `O produto ${item.nome} não está atrasado.`
                );
            }

            const valorBase =
                Number(
                    item.qtd || 0
                ) *
                Number(
                    item.valor_unit || 0
                );

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
                        valorBase
                    ),
                    dataVencimento,
                    idConta,
                    idProduto
                ]
            );

            contasAlteradas.add(
                idConta
            );
        }

        const statusAtrasado =
            await obterStatusAtrasado(
                conn
            );

        for (
            const idConta
            of contasAlteradas
        ) {
            await conn.query(
                `
                UPDATE contas_fiado
                SET
                    juros_aplicado = TRUE,
                    status = ?
                WHERE id_conta = ?
                `,
                [
                    statusAtrasado,
                    idConta
                ]
            );
        }

        await conn.commit();

        res.json({
            ok: true,
            mensagem:
                "Juros aplicados. A contagem continuará desde o vencimento até o pagamento."
        });

    } catch (err) {
        await conn.rollback();

        console.error(
            "Erro ao aplicar juros:",
            err
        );

        res.status(400).json({
            erro:
                err.message
        });

    } finally {
        conn.release();
    }
}

async function aplicarJurosPorProduto(req, res) {
    const conn = await conexao.getConnection();

    try {
        await conn.beginTransaction();

        const {
            itens,
            percentual,
            tipo,
            cliente
        } = req.body;

        const taxa = Number(percentual);

        if (!Array.isArray(itens) || itens.length === 0) {
            throw new Error("Nenhum produto foi selecionado.");
        }

        if (!Number.isFinite(taxa) || taxa < 0) {
            throw new Error("Porcentagem inválida.");
        }

        if (!["dia", "mes"].includes(String(tipo))) {
            throw new Error("Tipo de juros inválido.");
        }

        if (
            cliente !== undefined &&
            cliente !== null &&
            !Number.isFinite(Number(cliente))
        ) {
            throw new Error("Cliente inválido.");
        }

        const resultados = [];
        const contasAlteradas = new Set();

        for (const selecionado of itens) {

            const idConta = Number(selecionado.id_conta);
            const idProduto = Number(selecionado.id_produto);

            if (!Number.isInteger(idConta) || idConta <= 0) {
                throw new Error("Conta inválida.");
            }

            if (!Number.isInteger(idProduto) || idProduto <= 0) {
                throw new Error("Produto inválido.");
            }

            const [rows] = await conn.query(
                `
                SELECT
                    cf.id_conta,
                    cf.id_produto,
                    cf.qtd,
                    cf.valor_unit,
                    cf.status_pagamento,
                    cf.juros_ativo,
                    p.nome,
                    c.id_cliente,
                    c.data_vencimento
                FROM conta_fiado_prod cf
                INNER JOIN contas_fiado c
                    ON c.id_conta = cf.id_conta
                INNER JOIN produtos p
                    ON p.id_produto = cf.id_produto
                WHERE cf.id_conta = ?
                  AND cf.id_produto = ?
                FOR UPDATE
                `,
                [
                    idConta,
                    idProduto
                ]
            );

            if (rows.length === 0) {
                throw new Error(
                    `O produto ${idProduto} não foi encontrado na conta #${idConta}.`
                );
            }

            const item = rows[0];

            /*
             * Não permite aplicar juros novamente
             * em um produto que já possui juros.
             */
            if (
                String(item.status_pagamento || "Pendente")
                    .trim()
                    .toLowerCase() === "pago"
            ) {
                throw new Error(
                    `O produto "${item.nome}" já foi pago.`
                );
            }

            if (Number(item.juros_ativo) === 1) {
                throw new Error(
                    `O produto "${item.nome}" já possui juros aplicados.`
                );
            }

            const quantidade = Number(item.qtd || 0);
            const valorUnitario = Number(item.valor_unit || 0);

            const valorBase =
                Math.round(
                    quantidade * valorUnitario * 100
                ) / 100;

            if (
                !Number.isFinite(valorBase) ||
                valorBase < 0
            ) {
                throw new Error(
                    `Valor inválido para o produto "${item.nome}".`
                );
            }

            /*
             * ==================================================
             * DATA DE VENCIMENTO
             * ==================================================
             *
             * O MySQL pode devolver:
             * - Date
             * - YYYY-MM-DD
             * - YYYY-MM-DDTHH:mm:ss...
             *
             * Tratamos todos esses casos.
             */

            let dataVencimento;

            if (item.data_vencimento instanceof Date) {

                const ano = item.data_vencimento.getFullYear();
                const mes = String(
                    item.data_vencimento.getMonth() + 1
                ).padStart(2, "0");
                const dia = String(
                    item.data_vencimento.getDate()
                ).padStart(2, "0");

                dataVencimento =
                    `${ano}-${mes}-${dia}`;

            } else {

                const texto =
                    String(item.data_vencimento || "")
                        .trim();

                const match =
                    texto.match(
                        /^(\d{4})-(\d{2})-(\d{2})/
                    );

                if (!match) {
                    throw new Error(
                        `Data de vencimento inválida para o produto "${item.nome}".`
                    );
                }

                dataVencimento =
                    `${match[1]}-${match[2]}-${match[3]}`;
            }

            const vencimento =
                new Date(
                    `${dataVencimento}T00:00:00`
                );

            if (Number.isNaN(vencimento.getTime())) {
                throw new Error(
                    `Data de vencimento inválida para o produto "${item.nome}".`
                );
            }

            const hoje = new Date();

            hoje.setHours(
                0,
                0,
                0,
                0
            );

            const diasAtraso =
                Math.max(
                    0,
                    Math.floor(
                        (
                            hoje.getTime() -
                            vencimento.getTime()
                        ) / 86400000
                    )
                );

            let periodo;

            if (String(tipo) === "mes") {
                periodo = diasAtraso / 30;
            } else {
                periodo = diasAtraso;
            }

            const juros =
                valorBase *
                (taxa / 100) *
                periodo;

            const jurosArredondado =
                Math.round(
                    juros * 100
                ) / 100;

            const valorFinal =
                Math.round(
                    (
                        valorBase +
                        jurosArredondado
                    ) * 100
                ) / 100;

            /*
             * Salva os juros no produto.
             *
             * A data de início continua sendo
             * o vencimento original.
             */
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
                    String(tipo),
                    taxa,
                    valorBase,
                    dataVencimento,
                    idConta,
                    idProduto
                ]
            );

            contasAlteradas.add(idConta);

            resultados.push({
                id_conta: idConta,
                id_produto: idProduto,
                nome: item.nome,
                valor_original: valorBase,
                juros: jurosArredondado,
                valor_final: valorFinal,
                dias_atraso: diasAtraso,
                tipo: String(tipo),
                percentual: taxa
            });
        }

        /*
         * Marca somente que a conta possui juros.
         *
         * NÃO força "status = Atrasado" aqui,
         * porque isso pode quebrar caso o ENUM do banco
         * não tenha esse valor.
         *
         * O vencimento continua sendo usado para calcular
         * o atraso normalmente.
         */
        for (const idConta of contasAlteradas) {

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

        const totalOriginal =
            resultados.reduce(
                (total, item) =>
                    total +
                    Number(item.valor_original || 0),
                0
            );

        const totalJuros =
            resultados.reduce(
                (total, item) =>
                    total +
                    Number(item.juros || 0),
                0
            );

        const totalFinal =
            resultados.reduce(
                (total, item) =>
                    total +
                    Number(item.valor_final || 0),
                0
            );

        return res.json({
            sucesso: true,

            mensagem:
                "Juros aplicados com sucesso.",

            cliente:
                cliente ?? null,

            tipo: String(tipo),

            percentual: taxa,

            itens: resultados,

            valor_original:
                Math.round(
                    totalOriginal * 100
                ) / 100,

            juros:
                Math.round(
                    totalJuros * 100
                ) / 100,

            valor_final:
                Math.round(
                    totalFinal * 100
                ) / 100
        });

    } catch (err) {

        await conn.rollback();

        console.error(
            "Erro ao aplicar juros:",
            err
        );

        return res.status(400).json({
            sucesso: false,
            erro:
                err.message ||
                "Erro ao aplicar juros."
        });

    } finally {
        conn.release();
    }
}
/* ======================================================
   ROTAS DE APLICAÇÃO DE JUROS
====================================================== */

router.put(
    "/contas-fiado/juros/aplicar",
    verificarToken,
    aplicarJurosPorProduto
);

router.put(
    "/contas-fiado/aplicar-juros",
    verificarToken,
    aplicarJurosPorProduto
);

/* ======================================================
   FINALIZAR SOMENTE OS PRODUTOS SELECIONADOS
   ESTA ROTA PRECISA FICAR ANTES DE:
   /contas-fiado/:id/finalizar
====================================================== */

router.put(
    "/contas-fiado/itens/finalizar",
    verificarToken,
    async (req, res) => {

        const {
            data_pagamento,
            forma_pagamento,
            itens,
            parcelas,
            valor_parcela
        } = req.body;

        if (!data_pagamento) {
            return res.status(400).json({
                erro: "Data do pagamento não informada."
            });
        }

        if (!forma_pagamento) {
            return res.status(400).json({
                erro: "Forma de pagamento não informada."
            });
        }

        if (!Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({
                erro: "Nenhum produto foi selecionado."
            });
        }

        const conn = await conexao.getConnection();

        try {

            await conn.beginTransaction();

            const produtosHistorico = [];
            const contasAfetadas = new Set();

            for (const itemSelecionado of itens) {

                const idConta =
                    Number(itemSelecionado?.id_conta);

                const idProduto =
                    Number(itemSelecionado?.id_produto);

                if (
                    !Number.isInteger(idConta) ||
                    idConta <= 0
                ) {
                    throw new Error(
                        `Conta inválida para o produto ${idProduto}.`
                    );
                }

                if (
                    !Number.isInteger(idProduto) ||
                    idProduto <= 0
                ) {
                    throw new Error(
                        "Produto inválido."
                    );
                }

                const [rows] = await conn.query(
                    `
                    SELECT
                        cf.id_conta,
                        cf.id_produto,
                        cf.qtd,
                        cf.valor_unit,
                        cf.status_pagamento,
                        cf.juros_ativo,
                        cf.valor_juros_inicio,
                        cf.tipo_juros,
                        cf.taxa_juros,
                        cf.data_inicio_juros,

                        p.nome,

                        c.id_cliente,
                        c.data_vencimento

                    FROM conta_fiado_prod cf

                    INNER JOIN contas_fiado c
                        ON c.id_conta = cf.id_conta

                    INNER JOIN produtos p
                        ON p.id_produto = cf.id_produto

                    WHERE cf.id_conta = ?
                      AND cf.id_produto = ?

                    FOR UPDATE
                    `,
                    [
                        idConta,
                        idProduto
                    ]
                );

                if (!rows.length) {
                    throw new Error(
                        `O produto "${idProduto}" não foi encontrado nessa conta.`
                    );
                }

                const produto = rows[0];

                /*
                    SEGURANÇA:
                    produto que já foi pago não pode
                    ser concluído novamente.
                */

                if (
                    String(
                        produto.status_pagamento ||
                        "Pendente"
                    )
                        .trim()
                        .toLowerCase() === "pago"
                ) {
                    throw new Error(
                        `O produto "${produto.nome}" já foi concluído.`
                    );
                }

                /*
                    Valor original do produto.
                */

                const valorOriginal =
                    Number(produto.qtd || 0) *
                    Number(produto.valor_unit || 0);

                /*
                    Se houver juros aplicados, usamos
                    o valor atualmente devido.
                */

                let valorFinal =
                    valorOriginal;

                if (
                    Number(produto.juros_ativo) === 1 &&
                    Number(produto.valor_juros_inicio) > 0
                ) {
                    const vencimento =
                        dataSomenteLocal(
                            produto.data_inicio_juros ||
                            produto.data_vencimento
                        );

                    const diasAtraso =
                        calcularDiasAtraso(
                            produto.data_vencimento
                        );

                    const tipo =
                        normalizarTipoJuros(
                            produto.tipo_juros
                        );

                    const taxa =
                        Number(
                            produto.taxa_juros || 0
                        );

                    const valorBase =
                        Number(
                            produto.valor_juros_inicio
                        ) > 0
                            ? Number(
                                produto.valor_juros_inicio
                            )
                            : valorOriginal;

                    valorFinal =
                        calcularJurosSimples(
                            valorBase,
                            taxa,
                            tipo,
                            diasAtraso
                        );
                }

                /*
                    Marca SOMENTE este produto como pago.
                */

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
                        data_pagamento,
                        forma_pagamento,
                        idConta,
                        idProduto
                    ]
                );

                produtosHistorico.push({
                    id_produto: idProduto,
                    qtd: Number(produto.qtd || 0),
                    preco_unitario: Number(
                        produto.valor_unit || 0
                    ),
                    valor_total: Number(valorFinal || 0),
                    nome: produto.nome
                });

                contasAfetadas.add(idConta);
            }

            /*
                Atualiza o status das contas afetadas.

                Se ainda houver produtos pendentes,
                a conta NÃO é encerrada.
            */

            for (const idConta of contasAfetadas) {

                await atualizarStatusConta(
                    conn,
                    idConta
                );
            }

            /*
                TOTAL = SOMENTE OS PRODUTOS SELECIONADOS
            */

            const valorTotal =
                arredondar(
                    produtosHistorico.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.valor_total || 0
                            ),
                        0
                    )
                );

            const qtdTotal =
                produtosHistorico.reduce(
                    (total, item) =>
                        total +
                        Number(item.qtd || 0),
                    0
                );

            /*
                No histórico:
                    Fiado(Pix)
                    Fiado(Dinheiro)
                    Fiado(Cartão de Débito)
                    Fiado(Cartão de Crédito)
                    Fiado(Voucher/Ticket)
            */

            const formaHistorico =
                `Fiado(${String(
                    forma_pagamento
                ).trim()})`;

            const idUser =
                req.user?.id_user ??
                req.user?.id ??
                null;

            const [ultimoPedido] =
                await conn.query(
                    `
                    SELECT
                        MAX(num_pedido) AS max_num
                    FROM pedidos
                    FOR UPDATE
                    `
                );

            const numPedido =
                Number(
                    ultimoPedido[0]?.max_num || 0
                ) + 1;

            /*
                CRIA O REGISTRO NO HISTÓRICO.

                Não usa a rota normal de pedidos,
                para não descontar estoque novamente.
            */

            const [pedido] =
                await conn.query(
                    `
                    INSERT INTO pedidos
                    (
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
                    VALUES
                    (
                        ?,
                        ?,
                        NULL,
                        ?,
                        NULL,
                        'Finalizado',
                        'Fiado',
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        idUser,
                        numPedido,
                        data_pagamento,
                        valorTotal,
                        qtdTotal,
                        formaHistorico
                    ]
                );

            /*
                Somente os produtos selecionados entram
                nesse pedido do histórico.
            */

            for (const item of produtosHistorico) {

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
                        pedido.insertId,
                        item.id_produto,
                        item.qtd,
                        item.preco_unitario
                    ]
                );
            }

            await conn.commit();

            return res.json({
                sucesso: true,
                ok: true,
                mensagem:
                    "Produtos selecionados concluídos com sucesso.",
                id_pedido: pedido.insertId,
                num_pedido: numPedido,
                forma_pagamento: formaHistorico,
                valor_total: valorTotal,
                qtd_total: qtdTotal,
                parcelas: parcelas ?? null,
                valor_parcela: valor_parcela ?? null
            });

        } catch (erro) {

            await conn.rollback();

            console.error(
                "Erro ao concluir produtos selecionados:",
                erro
            );

            return res.status(400).json({
                sucesso: false,
                erro:
                    erro.message ||
                    "Erro ao concluir os produtos selecionados."
            });

        } finally {
            conn.release();
        }
    }
);
/* ======================================================
   FINALIZAR TODOS OS PRODUTOS PENDENTES DO CLIENTE
====================================================== */

router.put(
    "/contas-fiado/cliente/:id/finalizar",
    verificarToken,
    async (req, res) => {
        const idCliente =
            Number(
                req.params.id
            );

        const {
            data_conclusao,
            forma_pagamento
        } = req.body;

        if (
            !Number.isInteger(
                idCliente
            ) ||
            idCliente <= 0
        ) {
            return res.status(400).json({
                erro:
                    "Cliente inválido."
            });
        }

        if (
            !data_conclusao
        ) {
            return res.status(400).json({
                erro:
                    "Data do pagamento não informada."
            });
        }

        if (
            !forma_pagamento
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

            const [itens] =
                await conn.query(
                    `
                    SELECT
                        cf.id_conta,
                        cf.id_produto,
                        cf.qtd,
                        cf.valor_unit,
                        cf.status_pagamento,
                        p.nome
                    FROM conta_fiado_prod cf
                    INNER JOIN contas_fiado c
                        ON c.id_conta =
                           cf.id_conta
                    INNER JOIN produtos p
                        ON p.id_produto =
                           cf.id_produto
                    WHERE c.id_cliente = ?
                      AND LOWER(
                            TRIM(
                                COALESCE(
                                    cf.status_pagamento,
                                    'Pendente'
                                )
                            )
                          ) <> 'pago'
                    FOR UPDATE
                    `,
                    [idCliente]
                );

            if (
                itens.length === 0
            ) {
                throw new Error(
                    "Este cliente não possui produtos pendentes."
                );
            }

            await conn.query(
                `
                UPDATE conta_fiado_prod cf
                INNER JOIN contas_fiado c
                    ON c.id_conta =
                       cf.id_conta
                SET
                    cf.status_pagamento = 'Pago',
                    cf.data_pagamento = ?,
                    cf.forma_pagamento = ?,
                    cf.juros_ativo = FALSE
                WHERE c.id_cliente = ?
                  AND LOWER(
                        TRIM(
                            COALESCE(
                                cf.status_pagamento,
                                'Pendente'
                            )
                        )
                      ) <> 'pago'
                `,
                [
                    data_conclusao,
                    forma_pagamento,
                    idCliente
                ]
            );

            const idsContas = [
                ...new Set(
                    itens.map(
                        item =>
                            Number(
                                item.id_conta
                            )
                    )
                )
            ];

            for (
                const idConta
                of idsContas
            ) {
                await atualizarStatusConta(
                    conn,
                    idConta
                );
            }

            await conn.commit();

            res.json({
                ok: true,
                quantidade:
                    itens.length,
                contas:
                    idsContas,
                mensagem:
                    "Todos os produtos pendentes do cliente foram pagos."
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao finalizar produtos do cliente:",
                err
            );

            res.status(400).json({
                erro:
                    err.message
            });

        } finally {
            conn.release();
        }
    }
);


/* ======================================================
   PAGAR UM PRODUTO INDIVIDUAL
====================================================== */

router.put(
    "/contas-fiado/item/:idConta/:idProduto/pagar",
    verificarToken,
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
            data_conclusao,
            forma_pagamento
        } = req.body;

        const dataPagamento =
            data_pagamento ||
            data_conclusao;

        if (
            !dataPagamento
        ) {
            return res.status(400).json({
                erro:
                    "Data do pagamento não informada."
            });
        }

        if (
            !forma_pagamento
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

            const [item] =
                await conn.query(
                    `
                    SELECT
                        cf.id_conta,
                        cf.id_produto,
                        cf.status_pagamento,
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

            if (
                item.length === 0
            ) {
                throw new Error(
                    "Produto não encontrado nessa conta."
                );
            }

            if (
                String(
                    item[0]
                        .status_pagamento ||
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
                    dataPagamento,
                    forma_pagamento,
                    idConta,
                    idProduto
                ]
            );

            await atualizarStatusConta(
                conn,
                idConta
            );

            await conn.commit();

            res.json({
                ok: true,
                mensagem:
                    `${item[0].nome} foi marcado como pago.`
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao pagar item:",
                err
            );

            res.status(400).json({
                erro:
                    err.message
            });

        } finally {
            conn.release();
        }
    }
);


/* ======================================================
   FINALIZAR CONTA INTEIRA
====================================================== */

router.put(
    "/contas-fiado/:id/finalizar",
    verificarToken,
    async (req, res) => {
        const idConta =
            Number(
                req.params.id
            );

        const {
            data_conclusao,
            forma_pagamento
        } = req.body;

        if (
            !Number.isInteger(
                idConta
            ) ||
            idConta <= 0
        ) {
            return res.status(400).json({
                erro:
                    "Conta inválida."
            });
        }

        if (
            !data_conclusao
        ) {
            return res.status(400).json({
                erro:
                    "Data do pagamento não informada."
            });
        }

        if (
            !forma_pagamento
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

            const [conta] =
                await conn.query(
                    `
                    SELECT
                        id_conta
                    FROM contas_fiado
                    WHERE id_conta = ?
                    FOR UPDATE
                    `,
                    [idConta]
                );

            if (
                conta.length === 0
            ) {
                throw new Error(
                    "Conta fiado não encontrada."
                );
            }

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
                    forma_pagamento,
                    idConta
                ]
            );

            /*
                A função agora escolhe automaticamente
                um valor de status aceito pela coluna.
            */
            const novoStatus =
                await atualizarStatusConta(
                    conn,
                    idConta
                );

            await conn.commit();

            res.json({
                ok: true,
                status:
                    novoStatus,
                mensagem:
                    "Todos os produtos da conta foram pagos."
            });

        } catch (err) {
            await conn.rollback();

            console.error(
                "Erro ao finalizar conta:",
                err
            );

            res.status(400).json({
                erro:
                    err.message
            });

        } finally {
            conn.release();
        }
    }
);


module.exports = router;
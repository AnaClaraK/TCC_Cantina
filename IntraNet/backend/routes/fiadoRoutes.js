const express = require("express");

const router = express.Router();
const conexao = require("../db");
const verificarToken =
    require("../middlewares/auth");

/* ======================================================
   CONTROLE DE DATAS DAS PARCELAS DE CRÉDITO
====================================================== */

function dataHojeISO() {
    const hoje = new Date();

    return `${hoje.getFullYear()}-${String(
        hoje.getMonth() + 1
    ).padStart(2, "0")}-${String(
        hoje.getDate()
    ).padStart(2, "0")}`;
}

function normalizarDataCompra(valor) {
    if (!valor) {
        return dataHojeISO();
    }

    if (
        valor instanceof Date &&
        !Number.isNaN(valor.getTime())
    ) {
        return `${valor.getFullYear()}-${String(
            valor.getMonth() + 1
        ).padStart(2, "0")}-${String(
            valor.getDate()
        ).padStart(2, "0")}`;
    }

    const texto = String(valor).trim();

    const match = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }

    return dataHojeISO();
}

function adicionarMesesData(dataBase, meses) {
    const [ano, mes, dia] =
        normalizarDataCompra(dataBase)
            .split("-")
            .map(Number);

    const alvo = new Date(
        ano,
        (mes - 1) + Number(meses || 0),
        1
    );

    const ultimoDia =
        new Date(
            alvo.getFullYear(),
            alvo.getMonth() + 1,
            0
        ).getDate();

    const diaFinal = Math.min(dia, ultimoDia);

    return `${alvo.getFullYear()}-${String(
        alvo.getMonth() + 1
    ).padStart(2, "0")}-${String(
        diaFinal
    ).padStart(2, "0")}`;
}

function normalizarFormaPagamentoInterna(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}
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
                endereco,
                dia_vencimento
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

            dia_vencimento = Number(dia_vencimento);

            if (!Number.isInteger(dia_vencimento) || dia_vencimento < 1 || dia_vencimento > 31) {
                return res.status(400).json({
                    erro: "O dia de vencimento deve estar entre 1 e 31."
                });
            }

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
                    endereco,
                    dia_vencimento
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    nome_completo,
                    cpf,
                    telefone,
                    endereco,
                    dia_vencimento
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
   BLOQUEAR / DESBLOQUEAR CLIENTE FIADO
====================================================== */

router.put(
    "/clientes-fiado/:id/bloqueio",
    verificarToken,
    async (req, res) => {
        try {
            const idCliente = Number(req.params.id);
            const bloqueado = Number(req.body?.bloqueado) === 1 ? 1 : 0;

            if (!Number.isInteger(idCliente) || idCliente <= 0) {
                return res.status(400).json({ erro: "Cliente inválido." });
            }

            const [resultado] = await conexao.query(
                `UPDATE clientes_fiado SET bloqueado = ? WHERE id_cliente = ?`,
                [bloqueado, idCliente]
            );

            if (!resultado.affectedRows) {
                return res.status(404).json({ erro: "Cliente não encontrado." });
            }

            return res.json({
                sucesso: true,
                bloqueado
            });
        } catch (err) {
            console.error("Erro ao alterar bloqueio do cliente:", err);
            return res.status(500).json({ erro: err.message });
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

        const idCliente =
            Number(id_cliente);

        if (
            !Number.isInteger(idCliente) ||
            idCliente <= 0
        ) {
            return res.status(400).json({
                erro:
                    "Cliente não informado."
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

        /*
            A tela já envia a data de vencimento.
            Não dependemos de dia_vencimento para
            criar a compra.
        */
        const vencimentoFinal =
            normalizarDataTexto(
                vencimento
            );

        if (!vencimentoFinal) {
            return res.status(400).json({
                erro:
                    "Data de vencimento inválida."
            });
        }

        const conn =
            await conexao.getConnection();

        try {

            await conn.beginTransaction();


            /* ==================================================
               1. CLIENTE
            ================================================== */

            const [
                cliente
            ] =
                await conn.query(
                    `
                    SELECT
                        id_cliente,
                        bloqueado
                    FROM clientes_fiado
                    WHERE id_cliente = ?
                    FOR UPDATE
                    `,
                    [
                        idCliente
                    ]
                );


            if (
                !cliente.length
            ) {
                throw new Error(
                    "Cliente não encontrado."
                );
            }


            if (
                Number(
                    cliente[0].bloqueado || 0
                ) === 1
            ) {
                throw new Error(
                    "Este cliente está bloqueado para novas compras fiado."
                );
            }


            /* ==================================================
               2. NORMALIZA OS PRODUTOS

               Se o mesmo produto aparecer mais de uma vez,
               soma as quantidades antes do INSERT.
            ================================================== */

            const mapaProdutos =
                new Map();


            for (
                const produto
                of produtos
            ) {

                const idProduto =
                    Number(
                        produto?.id_produto ??
                        produto?.id ??
                        0
                    );

                const quantidade =
                    Number(
                        produto?.qtdSelecionada ??
                        produto?.qtd ??
                        produto?.quantidade ??
                        0
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


                mapaProdutos.set(
                    idProduto,
                    (
                        mapaProdutos.get(
                            idProduto
                        ) || 0
                    ) + quantidade
                );
            }


            /* ==================================================
               3. VALIDA PRODUTOS / ESTOQUE
            ================================================== */

            const itensValidados =
                [];

            let total =
                0;


            for (
                const [
                    idProduto,
                    quantidade
                ]
                of mapaProdutos
            ) {

                const [
                    dadosProduto
                ] =
                    await conn.query(
                        `
                        SELECT
                            id_produto,
                            nome,
                            qtd,
                            preco,
                            ativo
                        FROM produtos
                        WHERE id_produto = ?
                        FOR UPDATE
                        `,
                        [
                            idProduto
                        ]
                    );


                if (
                    !dadosProduto.length
                ) {
                    throw new Error(
                        "Produto não encontrado."
                    );
                }


                const produtoBanco =
                    dadosProduto[0];


                if (
                    Number(
                        produtoBanco.ativo
                    ) === 0
                ) {
                    throw new Error(
                        `O produto "${produtoBanco.nome}" está inativo e não pode ser vendido.`
                    );
                }


                const estoque =
                    Number(
                        produtoBanco.qtd
                    );


                const preco =
                    Number(
                        produtoBanco.preco
                    );


                if (
                    !Number.isFinite(
                        preco
                    ) ||
                    preco < 0
                ) {
                    throw new Error(
                        `Preço inválido para: ${produtoBanco.nome}`
                    );
                }


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


            if (
                total <= 0
            ) {
                throw new Error(
                    "O valor total da compra deve ser maior que zero."
                );
            }


            /* ==================================================
               4. CRIA A CONTA FIADO
            ================================================== */

            const [
                conta
            ] =
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
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'Pendente',
                        FALSE
                    )
                    `,
                    [
                        idCliente,
                        total,
                        total,
                        vencimentoFinal,
                        String(
                            origem
                        ).trim()
                    ]
                );


            const idConta =
                conta.insertId;


            /* ==================================================
               5. PRODUTOS DA CONTA
            ================================================== */

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
                        ?,
                        ?,
                        ?,
                        ?,
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


            return res.status(201).json({
                ok:
                    true,

                sucesso:
                    true,

                id_conta:
                    idConta,

                valor_total:
                    total
            });


        } catch (
            err
        ) {

            await conn.rollback();

            console.error(
                "Erro ao criar conta fiado:",
                err
            );

            return res.status(400).json({
                ok:
                    false,

                sucesso:
                    false,

                erro:
                    err.message ||
                    "Erro ao criar conta fiado."
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

        if (Number(parcelas) > 1) {
            return res.status(400).json({
                erro: "Use o fluxo de pagamento parcelado no cartão para compras em 2x ou mais."
            });
        }

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

router.get(
    "/contas-fiado/parceladas",
    verificarToken,
    async (req, res) => {
        let conn;

        try {
            conn = await conexao.getConnection();

            const hoje = dataHojeISO();
            const notificacoes = [];

            // ==================================================
            // PRIMEIRO: processa automaticamente as parcelas
            // cuja data de vencimento já chegou.
            // ==================================================

            const [parcelasVencidas] = await conn.query(`
                SELECT
                    cfp.*,
                    p.num_pedido,
                    p.valor_total,
                    p.id_conta_fiado,
                    p.origem,
                    c.nome_completo
                FROM conta_fiado_parcelas cfp
                INNER JOIN pedidos p
                    ON p.id_pedido = cfp.id_pedido
                LEFT JOIN clientes_fiado c
                    ON c.id_cliente = cfp.id_conta
                WHERE LOWER(COALESCE(cfp.status, 'Pendente')) <> 'pago'
                  AND cfp.data_vencimento <= ?
                ORDER BY
                    cfp.data_vencimento ASC,
                    cfp.numero_parcela ASC
            `, [hoje]);

            for (const parcela of parcelasVencidas) {

                const [resultadoPagamento] = await conn.query(`
                    UPDATE conta_fiado_parcelas
                    SET
                        status = 'Pago',
                        data_pagamento = ?
                    WHERE id_parcela = ?
                      AND LOWER(COALESCE(status, 'Pendente')) <> 'pago'
                `, [
                    hoje,
                    parcela.id_parcela
                ]);

                if (resultadoPagamento.affectedRows === 0) {
                    continue;
                }

                // Verifica se ainda existe alguma parcela pendente
                // para este mesmo pedido.
                const [parcelasPendentes] = await conn.query(`
                    SELECT COUNT(*) AS total
                    FROM conta_fiado_parcelas
                    WHERE id_pedido = ?
                      AND LOWER(COALESCE(status, 'Pendente')) <> 'pago'
                `, [
                    parcela.id_pedido
                ]);

                const totalPendentes =
                    Number(parcelasPendentes[0]?.total || 0);

                // ==================================================
                // ÚLTIMA PARCELA PAGA
                // ==================================================

                if (totalPendentes === 0) {

                    // --------------------------------------------------
                    // Se foi uma compra originada no CONTA FIADO,
                    // os produtos da conta passam para Pago.
                    // --------------------------------------------------

                    if (parcela.id_conta_fiado) {

                        await conn.query(`
                            UPDATE conta_fiado_prod cf
                            INNER JOIN pedidos_itens pi
                                ON pi.id_produto = cf.id_produto
                            SET
                                cf.status_pagamento = 'Pago',
                                cf.data_pagamento = ?,
                                cf.juros_ativo = FALSE
                            WHERE cf.id_conta = ?
                              AND pi.id_pedido = ?
                              AND LOWER(COALESCE(cf.status_pagamento, 'Pendente')) <> 'pago'
                        `, [
                            hoje,
                            parcela.id_conta_fiado,
                            parcela.id_pedido
                        ]);

                        await atualizarStatusConta(conn, parcela.id_conta_fiado);
                    }

                    // --------------------------------------------------
                    // Tanto PDV quanto Conta Fiado só chegam ao
                    // Histórico depois da última parcela.
                    // --------------------------------------------------

                    await conn.query(`
                        UPDATE pedidos
                        SET status = 'Finalizado'
                        WHERE id_pedido = ?
                    `, [
                        parcela.id_pedido
                    ]);

                    notificacoes.push(
                        `Compra concluída! O pedido #${parcela.num_pedido} foi enviado para o histórico de pedidos.`
                    );
                }
            }

            // ==================================================
            // BUSCA AS COMPRAS PARCELADAS AINDA PENDENTES
            //
            // IMPORTANTE:
            // NÃO usa INNER JOIN com contas_fiado.
            //
            // Isso permite que compras feitas diretamente no PDV,
            // que possuem id_conta = NULL, apareçam aqui.
            // ==================================================

            const [compras] = await conn.query(`
                SELECT
                    p.id_pedido,
                    p.num_pedido,
                    p.id_conta_fiado,
                    p.origem,
                    p.data,
                    p.valor_total,
                    SUM(cfp.valor) AS valor_credito,
                    p.form_pag,

                    c.nome_completo,

                    COUNT(cfp.id_parcela) AS total_parcelas,

                    SUM(
                        CASE
                            WHEN LOWER(
                                COALESCE(cfp.status, 'Pendente')
                            ) = 'pago'
                            THEN 1
                            ELSE 0
                        END
                    ) AS parcelas_pagas,

                    MIN(
                        CASE
                            WHEN LOWER(
                                COALESCE(cfp.status, 'Pendente')
                            ) <> 'pago'
                            THEN cfp.data_vencimento
                            ELSE NULL
                        END
                    ) AS proxima_parcela

                FROM pedidos p

                INNER JOIN conta_fiado_parcelas cfp
                    ON cfp.id_pedido = p.id_pedido

                LEFT JOIN clientes_fiado c
                    ON c.id_cliente = p.id_conta_fiado

                WHERE EXISTS (
                    SELECT 1
                    FROM conta_fiado_parcelas cfp2
                    WHERE cfp2.id_pedido = p.id_pedido
                      AND LOWER(
                          COALESCE(cfp2.status, 'Pendente')
                      ) <> 'pago'
                )

                GROUP BY
                    p.id_pedido,
                    p.num_pedido,
                    p.id_conta_fiado,
                    p.origem,
                    p.data,
                    p.valor_total,
                    p.form_pag,
                    c.nome_completo

                ORDER BY
                    proxima_parcela ASC
            `);

            for (const compra of compras) {
                const [parcelasCompra] = await conn.query(`
                    SELECT
                        id_parcela,
                        numero_parcela,
                        total_parcelas,
                        valor,
                        data_vencimento,
                        status,
                        data_pagamento
                    FROM conta_fiado_parcelas
                    WHERE id_pedido = ?
                    ORDER BY numero_parcela ASC
                `, [compra.id_pedido]);

                compra.parcelas = parcelasCompra;
                compra.valor_parcela = Number(parcelasCompra[0]?.valor || 0);
                compra.valor_credito = Number(compra.valor_credito || 0);
            }

            return res.json({
                sucesso: true,
                compras,
                notificacoes
            });

        } catch (erro) {

            console.error(
                "Erro ao carregar compras parceladas:",
                erro
            );

            return res.status(500).json({
                sucesso: false,
                mensagem:
                    "Erro ao carregar compras parceladas."
            });

        } finally {

            if (conn) {
                conn.release();
            }
        }
    }
);


// ==================== CRÉDITO PARCELADO DO PDV ====================

router.post(
    "/credito-parcelado-pdv",
    verificarToken,
    async (req, res) => {

        let conn;

        try {
            conn = await conexao.getConnection();
            await conn.beginTransaction();

            const {
                id_pedido,
                produtos,
                total,
                parcelas,
                valor_parcela,
                data_compra,
                valor_credito,
                pagamentos
            } = req.body;

            const qtdParcelas = Number(parcelas);

            if (
                !Number.isInteger(qtdParcelas) ||
                qtdParcelas < 2 ||
                qtdParcelas > 12
            ) {
                throw new Error(
                    "O cartão de crédito deve ter entre 2 e 12 parcelas."
                );
            }

            const dataCompra =
                normalizarDataCompra(data_compra);

            const idPedidoComanda = Number(id_pedido);

            const veioDeComanda =
                Number.isInteger(idPedidoComanda) &&
                idPedidoComanda > 0;

            let numeroPedido = null;
            let idPedido = null;
            let origem = "PDV";
            let codigoComanda = null;
            let produtosProcessar = [];

            /*
            ============================================================
            COMANDA DO PDV
            ============================================================
            */

            if (veioDeComanda) {

                const [comandas] =
                    await conn.query(
                        `
                        SELECT
                            id_pedido,
                            num_pedido,
                            codigo_comanda,
                            origem,
                            status,
                            valor_total,
                            qtd_total
                        FROM pedidos
                        WHERE id_pedido = ?
                        FOR UPDATE
                        `,
                        [
                            idPedidoComanda
                        ]
                    );

                if (!comandas.length) {
                    throw new Error(
                        "Comanda não encontrada."
                    );
                }

                const comanda =
                    comandas[0];

                if (
                    String(
                        comanda.status || ""
                    )
                        .trim()
                        .toLowerCase() ===
                    "finalizado"
                ) {
                    throw new Error(
                        "Esta comanda já foi finalizada."
                    );
                }

                const [itensComanda] =
                    await conn.query(
                        `
                        SELECT
                            pi.id_produto,
                            pi.qtd AS quantidade,
                            pi.preco_unitario AS preco,
                            p.nome,
                            p.qtd AS estoque,
                            p.qtd_min,
                            p.ativo
                        FROM pedidos_itens pi
                        INNER JOIN produtos p
                            ON p.id_produto =
                               pi.id_produto
                        WHERE pi.id_pedido = ?
                        FOR UPDATE
                        `,
                        [
                            idPedidoComanda
                        ]
                    );

                if (!itensComanda.length) {
                    throw new Error(
                        "A comanda não possui itens."
                    );
                }

                const [parcelasExistentes] =
                    await conn.query(
                        `
                        SELECT
                            id_parcela
                        FROM conta_fiado_parcelas
                        WHERE id_pedido = ?
                          AND LOWER(
                                COALESCE(
                                    status,
                                    'Pendente'
                                )
                              ) <> 'pago'
                        LIMIT 1
                        FOR UPDATE
                        `,
                        [
                            idPedidoComanda
                        ]
                    );

                if (parcelasExistentes.length) {
                    throw new Error(
                        "Esta comanda já possui um parcelamento pendente."
                    );
                }

                produtosProcessar =
                    itensComanda.map(
                        item => ({
                            id_produto:
                                Number(
                                    item.id_produto
                                ),

                            quantidade:
                                Number(
                                    item.quantidade
                                ),

                            preco:
                                Number(
                                    item.preco || 0
                                ),

                            nome:
                                item.nome,

                            estoque:
                                Number(
                                    item.estoque
                                ),

                            qtd_min:
                                Number(
                                    item.qtd_min || 0
                                ),

                            ativo:
                                Number(
                                    item.ativo
                                )
                        })
                    );

                idPedido =
                    idPedidoComanda;

                numeroPedido =
                    comanda.num_pedido;

                origem =
                    comanda.origem ||
                    "APP";

                codigoComanda =
                    comanda.codigo_comanda;

            } else {

                /*
                ========================================================
                VENDA NORMAL DO PDV
                ========================================================
                */

                if (
                    !Array.isArray(produtos) ||
                    produtos.length === 0
                ) {
                    throw new Error(
                        "Nenhum produto informado para o parcelamento."
                    );
                }

                const [ultimoPedido] =
                    await conn.query(
                        `
                        SELECT
                            MAX(num_pedido) AS max_num
                        FROM pedidos
                        FOR UPDATE
                        `
                    );

                numeroPedido =
                    Number(
                        ultimoPedido[0]?.max_num ||
                        0
                    ) + 1;

                produtosProcessar =
                    produtos.map(
                        item => ({
                            id_produto:
                                Number(
                                    item.id_produto ||
                                    item.id
                                ),

                            quantidade:
                                Number(
                                    item.quantidade ||
                                    item.qtd ||
                                    1
                                ),

                            preco:
                                Number(
                                    item.preco ??
                                    item.preco_unitario ??
                                    0
                                )
                        })
                    );
            }

            /*
            ============================================================
            TOTAL
            ============================================================
            */

            let valorTotal =
                Number(total);

            if (
                !Number.isFinite(
                    valorTotal
                ) ||
                valorTotal <= 0
            ) {
                valorTotal =
                    produtosProcessar.reduce(
                        (
                            soma,
                            item
                        ) =>
                            soma +
                            Number(
                                item.quantidade || 0
                            ) *
                            Number(
                                item.preco || 0
                            ),
                        0
                    );
            }

            if (
                !Number.isFinite(
                    valorTotal
                ) ||
                valorTotal <= 0
            ) {
                throw new Error(
                    "Valor total inválido."
                );
            }

            /*
            ============================================================
            VALOR DO CRÉDITO
            ============================================================
            */

            let valorCredito =
                Number(
                    valor_credito
                );

            if (
                !Number.isFinite(
                    valorCredito
                ) ||
                valorCredito <= 0
            ) {
                valorCredito =
                    valorTotal;
            }

            if (
                valorCredito >
                valorTotal + 0.009
            ) {
                throw new Error(
                    "O valor do crédito não pode ser maior que o total da compra."
                );
            }

            let valorParcelaCalculado =
                Number(
                    valor_parcela
                );

            if (
                !Number.isFinite(
                    valorParcelaCalculado
                ) ||
                valorParcelaCalculado <= 0
            ) {
                valorParcelaCalculado =
                    valorCredito /
                    qtdParcelas;
            }

            valorParcelaCalculado =
                arredondar(
                    valorParcelaCalculado
                );

            /*
            ============================================================
            FORMA DE PAGAMENTO PARA O HISTÓRICO
            ============================================================
            */

            const formaHistorico =
                Array.isArray(pagamentos) &&
                pagamentos.length
                    ? pagamentos
                        .map(
                            p => {

                                const metodo =
                                    String(
                                        p.metodo ||
                                        ""
                                    ).trim();

                                const parcelasTexto =
                                    metodo ===
                                    "Cartão de Crédito"
                                        ? ` — ${Number(
                                            p.parcelas ||
                                            qtdParcelas
                                        )}x`
                                        : "";

                                return (
                                    `${metodo}${parcelasTexto}: R$ ${Number(
                                        p.valor || 0
                                    ).toFixed(2)}`
                                );
                            }
                        )
                        .join(" + ")
                    :
                    `Cartão de Crédito — ${qtdParcelas}x: R$ ${Number(
                        valorCredito
                    ).toFixed(2)}`;

            /*
            ============================================================
            COMANDA
            ============================================================
            */

            if (veioDeComanda) {

                for (
                    const item
                    of produtosProcessar
                ) {

                    if (
                        !Number.isInteger(
                            item.id_produto
                        ) ||
                        item.id_produto <= 0
                    ) {
                        throw new Error(
                            "Produto inválido."
                        );
                    }

                    if (
                        !Number.isInteger(
                            item.quantidade
                        ) ||
                        item.quantidade <= 0
                    ) {
                        throw new Error(
                            "Quantidade de produto inválida."
                        );
                    }

                    if (
                        item.ativo === 0
                    ) {
                        throw new Error(
                            `O produto "${item.nome}" está inativo e não pode ser vendido.`
                        );
                    }

                    const novaQtd =
                        Number(
                            item.estoque
                        ) -
                        Number(
                            item.quantidade
                        );

                    if (
                        novaQtd < 0
                    ) {
                        throw new Error(
                            `Estoque insuficiente para: ${item.nome}`
                        );
                    }

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

                await conn.query(
                    `
                    UPDATE pedidos
                    SET
                        status = 'Pendente',
                        valor_total = ?,
                        qtd_total = ?,
                        form_pag = ?,
                        data = ?
                    WHERE id_pedido = ?
                    `,
                    [
                        valorTotal,

                        produtosProcessar.reduce(
                            (
                                soma,
                                item
                            ) =>
                                soma +
                                Number(
                                    item.quantidade ||
                                    0
                                ),
                            0
                        ),

                        formaHistorico,

                        dataCompra,

                        idPedidoComanda
                    ]
                );

            } else {

                /*
                ========================================================
                NOVA VENDA DIRETA DO PDV
                ========================================================
                */

                const idUser =
                    req.user?.id_user ??
                    req.user?.id ??
                    req.usuario?.id_user ??
                    req.usuario?.id ??
                    null;

                const [
                    pedidoResult
                ] =
                    await conn.query(
                        `
                        INSERT INTO pedidos (
                            id_user,
                            id_conta_fiado,
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
                        VALUES (
                            ?,
                            NULL,
                            ?,
                            NULL,
                            ?,
                            NULL,
                            'Pendente',
                            'PDV',
                            ?,
                            ?,
                            ?
                        )
                        `,
                        [
                            idUser,
                            numeroPedido,
                            dataCompra,
                            valorTotal,

                            produtosProcessar.reduce(
                                (
                                    soma,
                                    item
                                ) =>
                                    soma +
                                    Number(
                                        item.quantidade ||
                                        0
                                    ),
                                0
                            ),

                            formaHistorico
                        ]
                    );

                idPedido =
                    pedidoResult.insertId;

                for (
                    const item
                    of produtosProcessar
                ) {

                    if (
                        !Number.isInteger(
                            item.id_produto
                        ) ||
                        item.id_produto <= 0
                    ) {
                        throw new Error(
                            "Produto inválido."
                        );
                    }

                    if (
                        !Number.isInteger(
                            item.quantidade
                        ) ||
                        item.quantidade <= 0
                    ) {
                        throw new Error(
                            "Quantidade de produto inválida."
                        );
                    }

                    const [
                        produto
                    ] =
                        await conn.query(
                            `
                            SELECT
                                id_produto,
                                nome,
                                preco,
                                qtd,
                                ativo
                            FROM produtos
                            WHERE id_produto = ?
                            FOR UPDATE
                            `,
                            [
                                item.id_produto
                            ]
                        );

                    if (
                        !produto.length
                    ) {
                        throw new Error(
                            `Produto ${item.id_produto} não encontrado.`
                        );
                    }

                    if (
                        Number(
                            produto[0].ativo
                        ) === 0
                    ) {
                        throw new Error(
                            `O produto "${produto[0].nome}" está inativo e não pode ser vendido.`
                        );
                    }

                    if (
                        Number(
                            produto[0].qtd
                        ) <
                        item.quantidade
                    ) {
                        throw new Error(
                            `Estoque insuficiente para: ${produto[0].nome}`
                        );
                    }

                    const preco =
                        Number(
                            item.preco ??
                            item.preco_unitario ??
                            produto[0].preco ??
                            0
                        );

                    if (
                        !Number.isFinite(
                            preco
                        ) ||
                        preco < 0
                    ) {
                        throw new Error(
                            `Preço inválido para: ${produto[0].nome}`
                        );
                    }

                    await conn.query(
                        `
                        INSERT INTO pedidos_itens (
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
                            item.quantidade,
                            preco
                        ]
                    );

                    const [
                        estoqueAtualizado
                    ] =
                        await conn.query(
                            `
                            UPDATE produtos
                            SET qtd = qtd - ?
                            WHERE id_produto = ?
                              AND qtd >= ?
                            `,
                            [
                                item.quantidade,
                                item.id_produto,
                                item.quantidade
                            ]
                        );

                    if (
                        estoqueAtualizado.affectedRows !== 1
                    ) {
                        throw new Error(
                            `Estoque insuficiente para: ${produto[0].nome}`
                        );
                    }
                }
            }

            /*
            ============================================================
            CRIA AS PARCELAS
            ============================================================
            */

            for (
                let numero = 1;
                numero <= qtdParcelas;
                numero++
            ) {

                const vencimento =
                    adicionarMesesData(
                        dataCompra,
                        numero
                    );

                await conn.query(
                    `
                    INSERT INTO conta_fiado_parcelas (
                        id_conta,
                        id_pedido,
                        numero_parcela,
                        total_parcelas,
                        valor,
                        data_vencimento,
                        status
                    )
                    VALUES (
                        NULL,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        idPedido,

                        numero,

                        qtdParcelas,

                        valorParcelaCalculado,

                        vencimento,

                        numero === 1
                            ? "Pago"
                            : "Pendente"
                    ]
                );
            }

            await conn.commit();

            return res.json({
                sucesso: true,
                id_pedido: idPedido,
                num_pedido: numeroPedido,
                codigo_comanda:
                    codigoComanda,
                origem,
                parcelas:
                    qtdParcelas,
                valor_parcela:
                    valorParcelaCalculado
            });

        } catch (erro) {

            if (conn) {
                await conn.rollback();
            }

            console.error(
                "Erro ao criar crédito parcelado do PDV:",
                erro
            );

            return res.status(400).json({
                sucesso: false,
                mensagem:
                    erro.message ||
                    "Erro ao criar parcelamento."
            });

        } finally {

            if (conn) {
                conn.release();
            }
        }
    }
);


/* ======================================================
   PAGAMENTO PARCELADO NO CARTÃO — CONTA FIADO
====================================================== */

router.post(
    "/contas-fiado/itens/credito-parcelado",
    verificarToken,
    async (req, res) => {
        let conn;
        try {
            const {
                data_pagamento,
                forma_pagamento,
                itens,
                parcelas,
                valor_credito,
                valor_total
            } = req.body;

            const qtdParcelas = Number(parcelas);
            if (!data_pagamento) throw new Error("Data do pagamento não informada.");
            if (!Array.isArray(itens) || !itens.length) throw new Error("Nenhum produto foi selecionado.");
            if (!Number.isInteger(qtdParcelas) || qtdParcelas < 2 || qtdParcelas > 12) {
                throw new Error("O cartão de crédito deve ter entre 2 e 12 parcelas.");
            }

            conn = await conexao.getConnection();
            await conn.beginTransaction();

            const idsContas = [...new Set(itens.map(i => Number(i.id_conta)).filter(Number.isInteger))];
            if (idsContas.length !== 1) throw new Error("Selecione produtos da mesma conta para parcelar no cartão.");
            const idConta = idsContas[0];

            const produtos = [];
            for (const item of itens) {
                const idProduto = Number(item.id_produto);
                const [rows] = await conn.query(`
                    SELECT cf.id_conta, cf.id_produto, cf.qtd, cf.valor_unit,
                           cf.status_pagamento, p.nome
                    FROM conta_fiado_prod cf
                    INNER JOIN produtos p ON p.id_produto = cf.id_produto
                    WHERE cf.id_conta = ? AND cf.id_produto = ?
                    FOR UPDATE
                `, [idConta, idProduto]);

                if (!rows.length) throw new Error(`Produto ${idProduto} não encontrado nessa conta.`);
                if (String(rows[0].status_pagamento || 'Pendente').toLowerCase() === 'pago') {
                    throw new Error(`O produto "${rows[0].nome}" já foi pago.`);
                }
                produtos.push(rows[0]);
            }

            const totalItens = produtos.reduce((s, p) => s + Number(p.qtd || 0) * Number(p.valor_unit || 0), 0);
            const totalInformado = Number(valor_total);
            const totalBase = Number.isFinite(totalInformado) && totalInformado > 0 ? totalInformado : totalItens;
            const credito = Number(valor_credito);
            if (!Number.isFinite(credito) || credito <= 0 || credito - totalBase > 0.009) {
                throw new Error("Valor do cartão de crédito inválido.");
            }

            const valorParcela = credito / qtdParcelas;
            const [ultimo] = await conn.query(`SELECT MAX(num_pedido) AS max_num FROM pedidos FOR UPDATE`);
            const numPedido = Number(ultimo[0]?.max_num || 0) + 1;
            const idUser = req.user?.id_user ?? req.user?.id ?? null;
            const forma = String(forma_pagamento || `Cartão de Crédito — ${qtdParcelas}x`).trim();

            const [pedido] = await conn.query(`
                INSERT INTO pedidos (
                    id_user, id_conta_fiado, num_pedido, codigo_comanda,
                    data, data_ag, status, origem, valor_total, qtd_total, form_pag
                ) VALUES (?, ?, ?, NULL, ?, NULL, 'Pendente', 'Fiado', ?, ?, ?)
            `, [
                idUser, idConta, numPedido, data_pagamento,
                totalBase,
                produtos.reduce((s, p) => s + Number(p.qtd || 0), 0),
                forma
            ]);

            const idPedido = pedido.insertId;
            for (const p of produtos) {
                await conn.query(`
                    INSERT INTO pedidos_itens (id_pedido, id_produto, qtd, preco_unitario)
                    VALUES (?, ?, ?, ?)
                `, [idPedido, p.id_produto, p.qtd, p.valor_unit]);
            }

            for (let numero = 1; numero <= qtdParcelas; numero++) {
                const vencimento = adicionarMesesData(normalizarDataCompra(data_pagamento), numero);
                const valor = numero === qtdParcelas
                    ? Number((credito - valorParcela * (qtdParcelas - 1)).toFixed(2))
                    : Number(valorParcela.toFixed(2));
                await conn.query(`
                    INSERT INTO conta_fiado_parcelas
                    (id_conta, id_pedido, numero_parcela, total_parcelas, valor, data_vencimento, status, data_pagamento)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    idConta, idPedido, numero, qtdParcelas, valor, vencimento,
                    numero === 1 ? 'Pago' : 'Pendente',
                    numero === 1 ? data_pagamento : null
                ]);
            }

            await conn.commit();
            return res.json({
                sucesso: true,
                id_pedido: idPedido,
                num_pedido: numPedido,
                parcelas: qtdParcelas,
                valor_parcela: Number(valorParcela.toFixed(2)),
                mensagem: `Pagamento em ${qtdParcelas}x registrado. A 1ª parcela já está paga; as próximas serão concluídas automaticamente na data de cada parcela.`
            });
        } catch (erro) {
            if (conn) await conn.rollback();
            console.error("Erro ao criar parcelamento do Conta Fiado:", erro);
            return res.status(400).json({ sucesso: false, erro: erro.message || "Erro ao criar parcelamento." });
        } finally {
            if (conn) conn.release();
        }
    }
);


/* ======================================================
   FINALIZAR CONTA INTEIRA
====================================================== */
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
            forma_pagamento,
            parcelas,
            valor_parcela,
            valor_credito,
            pagamentos
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


            /* ==================================================
               1. LOCALIZA A CONTA
            ================================================== */

            const [
                contas
            ] =
                await conn.query(
                    `
                    SELECT
                        c.id_conta,
                        c.id_cliente
                    FROM contas_fiado c
                    WHERE c.id_conta = ?
                    FOR UPDATE
                    `,
                    [
                        idConta
                    ]
                );


            if (
                !contas.length
            ) {
                throw new Error(
                    "Conta fiado não encontrada."
                );
            }


            /* ==================================================
               2. BUSCA TODOS OS PRODUTOS PENDENTES DA CONTA
            ================================================== */

            const [
                itensConta
            ] =
                await conn.query(
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

                        c.data_vencimento

                    FROM conta_fiado_prod cf

                    INNER JOIN contas_fiado c
                        ON c.id_conta =
                           cf.id_conta

                    INNER JOIN produtos p
                        ON p.id_produto =
                           cf.id_produto

                    WHERE cf.id_conta = ?

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
                    [
                        idConta
                    ]
                );


            if (
                !itensConta.length
            ) {
                throw new Error(
                    "Esta conta não possui produtos pendentes."
                );
            }


            /* ==================================================
               3. MONTA OS PRODUTOS QUE IRÃO PARA O PEDIDO
            ================================================== */

            const produtosHistorico =
                [];


            for (
                const produto
                of itensConta
            ) {

                const valorOriginal =
                    Number(
                        produto.qtd || 0
                    ) *
                    Number(
                        produto.valor_unit || 0
                    );


                let valorFinal =
                    valorOriginal;


                /* ------------------------------------------
                   APLICA JUROS, SE EXISTIREM
                ------------------------------------------ */

                if (
                    Number(
                        produto.juros_ativo
                    ) === 1 &&

                    Number(
                        produto.valor_juros_inicio
                    ) > 0
                ) {

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


                produtosHistorico.push({
                    id_produto:
                        Number(
                            produto.id_produto
                        ),

                    qtd:
                        Number(
                            produto.qtd || 0
                        ),

                    preco_unitario:
                        Number(
                            produto.valor_unit || 0
                        ),

                    valor_total:
                        Number(
                            valorFinal || 0
                        ),

                    nome:
                        produto.nome
                });


                /* ------------------------------------------
                   O FIADO ORIGINAL FOI QUITADO.
                   
                   Isso não significa que o novo pedido
                   de cartão já foi quitado.
                ------------------------------------------ */

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
                        data_conclusao,
                        forma_pagamento,
                        idConta,
                        produto.id_produto
                    ]
                );
            }


            /* ==================================================
               4. ATUALIZA O STATUS DA CONTA FIADO
            ================================================== */

            await atualizarStatusConta(
                conn,
                idConta
            );


            /* ==================================================
               5. TOTAL DA COMPRA
            ================================================== */

            const valorTotal =
                arredondar(
                    produtosHistorico.reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            Number(
                                item.valor_total || 0
                            ),
                        0
                    )
                );


            const qtdTotal =
                produtosHistorico.reduce(
                    (
                        total,
                        item
                    ) =>
                        total +
                        Number(
                            item.qtd || 0
                        ),
                    0
                );


            /* ==================================================
               6. DETECTA SE O PAGAMENTO TEM CARTÃO DE CRÉDITO
            ================================================== */

            const formaNormalizada =
                normalizarFormaPagamentoInterna(
                    forma_pagamento
                );


            const creditoNosPagamentos =
                Array.isArray(
                    pagamentos
                ) &&
                pagamentos.some(
                    p =>
                        normalizarFormaPagamentoInterna(
                            p?.metodo
                        ).includes(
                            "cartao de credito"
                        )
                );


            const ehCredito =
                formaNormalizada.includes(
                    "cartao de credito"
                ) ||
                creditoNosPagamentos;


            /* ==================================================
               7. QUANTIDADE DE PARCELAS
            ================================================== */

            let qtdParcelas =
                Number(
                    parcelas
                );


            if (
                !Number.isInteger(
                    qtdParcelas
                ) ||
                qtdParcelas < 1
            ) {

                const pagamentoCredito =
                    Array.isArray(
                        pagamentos
                    )
                        ? pagamentos.find(
                            p =>
                                normalizarFormaPagamentoInterna(
                                    p?.metodo
                                ).includes(
                                    "cartao de credito"
                                )
                        )
                        : null;


                qtdParcelas =
                    Number(
                        pagamentoCredito?.parcelas ||
                        1
                    );
            }


            if (
                ehCredito &&
                (
                    qtdParcelas < 1 ||
                    qtdParcelas > 12
                )
            ) {
                throw new Error(
                    "O cartão de crédito deve ter entre 1 e 12 parcelas."
                );
            }


            /* ==================================================
               8. VALOR QUE FOI PAGO NO CRÉDITO
            ================================================== */

            let valorCredito =
                Number(
                    valor_credito
                );


            if (
                !Number.isFinite(
                    valorCredito
                ) ||
                valorCredito <= 0
            ) {

                if (
                    Array.isArray(
                        pagamentos
                    ) &&
                    pagamentos.length
                ) {

                    valorCredito =
                        pagamentos
                            .filter(
                                p =>
                                    normalizarFormaPagamentoInterna(
                                        p?.metodo
                                    ).includes(
                                        "cartao de credito"
                                    )
                            )
                            .reduce(
                                (
                                    total,
                                    p
                                ) =>
                                    total +
                                    Number(
                                        p?.valor || 0
                                    ),
                                0
                            );
                }
            }


            if (
                !ehCredito
            ) {

                valorCredito =
                    0;

                qtdParcelas =
                    null;

            } else if (
                !Number.isFinite(
                    valorCredito
                ) ||
                valorCredito <= 0
            ) {

                valorCredito =
                    valorTotal;
            }


            if (
                ehCredito &&
                valorCredito >
                    valorTotal + 0.009
            ) {
                throw new Error(
                    "O valor do crédito não pode ser maior que o total da compra."
                );
            }


            /* ==================================================
               9. VALOR DE CADA PARCELA
            ================================================== */

            let valorParcelaCalculado =
                null;


            if (
                ehCredito
            ) {

                valorParcelaCalculado =
                    Number(
                        valor_parcela
                    );


                if (
                    !Number.isFinite(
                        valorParcelaCalculado
                    ) ||
                    valorParcelaCalculado <= 0
                ) {

                    valorParcelaCalculado =
                        valorCredito /
                        qtdParcelas;
                }


                valorParcelaCalculado =
                    arredondar(
                        valorParcelaCalculado
                    );
            }


            /* ==================================================
               10. USUÁRIO
            ================================================== */

            const idUser =
                req.user?.id_user ??
                req.user?.id ??
                req.usuario?.id_user ??
                req.usuario?.id ??
                null;


            /* ==================================================
               11. PRÓXIMO NÚMERO DO PEDIDO
            ================================================== */

            const [
                ultimoPedido
            ] =
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


            /* ==================================================
               12. FORMA DE PAGAMENTO DO HISTÓRICO
            ================================================== */

            const formaHistorico =
                Array.isArray(
                    pagamentos
                ) &&
                pagamentos.length

                    ? pagamentos
                        .map(
                            p => {

                                const metodo =
                                    String(
                                        p?.metodo || ""
                                    ).trim();


                                const parcelasTexto =
                                    normalizarFormaPagamentoInterna(
                                        metodo
                                    ).includes(
                                        "cartao de credito"
                                    )

                                        ? ` — ${
                                            Number(
                                                p?.parcelas ||
                                                qtdParcelas ||
                                                1
                                            )
                                        }x`

                                        : "";


                                return (
                                    `${metodo}${parcelasTexto}: R$ ${
                                        Number(
                                            p?.valor || 0
                                        ).toFixed(2)
                                    }`
                                );
                            }
                        )
                        .join(" + ")

                    : ehCredito

                        ? `Fiado(Cartão de Crédito — ${qtdParcelas}x)`

                        : `Fiado(${String(
                            forma_pagamento
                        ).trim()})`;


            /* ==================================================
               13. CRIA O PEDIDO NO HISTÓRICO
               
               CRÉDITO:
               fica Pendente enquanto houver parcelas.

               OUTRAS FORMAS:
               fica Finalizado imediatamente.
            ================================================== */

            const [
                pedido
            ] =
                await conn.query(
                    `
                    INSERT INTO pedidos
                    (
                        id_user,
                        id_conta_fiado,
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
                        ?,
                        NULL,
                        ?,
                        NULL,
                        ?,
                        'Fiado',
                        ?,
                        ?,
                        ?
                    )
                    `,
                    [
                        idUser,

                        idConta,

                        numPedido,

                        data_conclusao,

                        ehCredito
                            ? "Pendente"
                            : "Finalizado",

                        valorTotal,

                        qtdTotal,

                        formaHistorico
                    ]
                );


            /* ==================================================
               14. CRIA OS ITENS DO PEDIDO
            ================================================== */

            for (
                const item
                of produtosHistorico
            ) {

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


            /* ==================================================
               15. CARTÃO DE CRÉDITO
               
               CRIA AS PARCELAS NO BANCO.

               Todas começam como Pendente.
               
               A primeira vence um mês após a compra.
            ================================================== */

            if (
                ehCredito
            ) {

                const dataCompra =
                    normalizarDataCompra(
                        data_conclusao
                    );


                for (
                    let numero = 1;
                    numero <= qtdParcelas;
                    numero++
                ) {

                    const vencimento =
                        adicionarMesesData(
                            dataCompra,
                            numero
                        );


                    await conn.query(
                        `
                        INSERT INTO conta_fiado_parcelas
                        (
                            id_conta,
                            id_pedido,
                            numero_parcela,
                            total_parcelas,
                            valor,
                            data_vencimento,
                            status
                        )

                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            'Pendente'
                        )
                        `,
                        [
                            idConta,

                            pedido.insertId,

                            numero,

                            qtdParcelas,

                            valorParcelaCalculado,

                            vencimento
                        ]
                    );
                }
            }


            /* ==================================================
               16. FINALIZA A TRANSAÇÃO
            ================================================== */

            await conn.commit();


            return res.json({

                ok:
                    true,

                sucesso:
                    true,

                status:
                    ehCredito
                        ? "Pendente"
                        : "Finalizado",

                id_pedido:
                    pedido.insertId,

                num_pedido:
                    numPedido,

                parcelas:
                    ehCredito
                        ? qtdParcelas
                        : null,

                valor_parcela:
                    ehCredito
                        ? valorParcelaCalculado
                        : null,

                mensagem:
                    ehCredito

                        ? "Compra registrada no cartão de crédito. As parcelas ficaram pendentes e aparecerão em Compras Parceladas e no Histórico de Pedidos."

                        : "Todos os produtos da conta foram pagos e a compra foi registrada no histórico."
            });


        } catch (
            err
        ) {

            await conn.rollback();


            console.error(
                "Erro ao finalizar conta:",
                err
            );


            return res.status(400).json({
                sucesso:
                    false,

                erro:
                    err.message
            });


        } finally {

            conn.release();

        }
    }
);

router.get(
    "/contas-fiado/parceladas",
    verificarToken,
    async (req, res) => {
        let conn;

        try {
            conn =
                await conexao.getConnection();

            const hoje =
                dataHojeISO();

            const notificacoes =
                [];


            /* ==================================================
               1. LOCALIZA PARCELAS QUE JÁ CHEGARAM AO VENCIMENTO
            ================================================== */

            const [
                parcelasVencidas
            ] =
                await conn.query(
                    `
                    SELECT
                        cfp.*,

                        p.num_pedido,
                        p.valor_total,
                        p.id_conta_fiado,
                        p.origem,

                        c.nome_completo

                    FROM conta_fiado_parcelas cfp

                    INNER JOIN pedidos p
                        ON p.id_pedido =
                           cfp.id_pedido

                    LEFT JOIN contas_fiado cf
                        ON cf.id_conta =
                           p.id_conta_fiado

                    LEFT JOIN clientes_fiado c
                        ON c.id_cliente =
                           cf.id_cliente

                    WHERE LOWER(
                        COALESCE(
                            cfp.status,
                            'Pendente'
                        )
                    ) <> 'pago'

                      AND cfp.data_vencimento <= ?

                    ORDER BY
                        cfp.data_vencimento ASC,
                        cfp.numero_parcela ASC
                    `,
                    [
                        hoje
                    ]
                );


            /* ==================================================
               2. PAGA AUTOMATICAMENTE CADA PARCELA VENCIDA
            ================================================== */

            for (
                const parcela
                of parcelasVencidas
            ) {

                const [
                    resultadoPagamento
                ] =
                    await conn.query(
                        `
                        UPDATE conta_fiado_parcelas

                        SET
                            status = 'Pago',
                            data_pagamento = ?

                        WHERE id_parcela = ?

                          AND LOWER(
                              COALESCE(
                                  status,
                                  'Pendente'
                              )
                          ) <> 'pago'
                        `,
                        [
                            hoje,
                            parcela.id_parcela
                        ]
                    );


                if (
                    resultadoPagamento.affectedRows === 0
                ) {
                    continue;
                }


                /* ==================================================
                   3. VERIFICA SE AINDA EXISTEM PARCELAS PENDENTES
                ================================================== */

                const [
                    parcelasPendentes
                ] =
                    await conn.query(
                        `
                        SELECT
                            COUNT(*) AS total

                        FROM conta_fiado_parcelas

                        WHERE id_pedido = ?

                          AND LOWER(
                              COALESCE(
                                  status,
                                  'Pendente'
                              )
                          ) <> 'pago'
                        `,
                        [
                            parcela.id_pedido
                        ]
                    );


                const totalPendentes =
                    Number(
                        parcelasPendentes[0]?.total || 0
                    );


                /* ==================================================
                   4. SE NÃO EXISTIR MAIS NENHUMA:
                      ESSA FOI A ÚLTIMA PARCELA
                ================================================== */

                if (
                    totalPendentes === 0
                ) {

                    /* ------------------------------------------
                       SE O PEDIDO VEIO DO CONTA FIADO,
                       FINALIZA OS PRODUTOS DA CONTA ORIGINAL
                    ------------------------------------------ */

                    if (
                        parcela.id_conta_fiado
                    ) {

                        await conn.query(
                            `
                            UPDATE conta_fiado_prod cf

                            INNER JOIN pedidos_itens pi
                                ON pi.id_produto =
                                   cf.id_produto

                            SET
                                cf.status_pagamento = 'Pago',
                                cf.data_pagamento = ?,
                                cf.juros_ativo = FALSE

                            WHERE cf.id_conta = ?

                              AND pi.id_pedido = ?

                              AND LOWER(
                                  COALESCE(
                                      cf.status_pagamento,
                                      'Pendente'
                                  )
                              ) <> 'pago'
                            `,
                            [
                                hoje,
                                parcela.id_conta_fiado,
                                parcela.id_pedido
                            ]
                        );


                        await atualizarStatusConta(
                            conn,
                            parcela.id_conta_fiado
                        );
                    }


                    /* ------------------------------------------
                       PEDIDO CONCLUÍDO:
                       AGORA ELE PODE IR PARA O HISTÓRICO
                    ------------------------------------------ */

                    await conn.query(
                        `
                        UPDATE pedidos

                        SET
                            status = 'Finalizado'

                        WHERE id_pedido = ?
                        `,
                        [
                            parcela.id_pedido
                        ]
                    );


                    /* ------------------------------------------
                       NOTIFICAÇÃO PARA O CONTA FIADO
                    ------------------------------------------ */

                    notificacoes.push(
                        `Compra concluída! O pedido #${parcela.num_pedido} foi enviado para o histórico de pedidos.`
                    );
                }
            }


            /* ==================================================
               5. BUSCA COMPRAS QUE AINDA POSSUEM PARCELAS
                  PENDENTES

               Não filtra pela origem.

               Portanto:
               PDV
               Comanda
               Conta Fiado
               todos entram aqui se tiverem parcelas.
            ================================================== */

            const [
                compras
            ] =
                await conn.query(
                    `
                    SELECT
                        p.id_pedido,
                        p.num_pedido,
                        p.id_conta_fiado,
                        p.origem,
                        p.data,
                        p.valor_total,

                        SUM(
                            cfp.valor
                        ) AS valor_credito,

                        p.form_pag,

                        c.nome_completo,

                        COUNT(
                            cfp.id_parcela
                        ) AS total_parcelas,

                        SUM(
                            CASE
                                WHEN LOWER(
                                    COALESCE(
                                        cfp.status,
                                        'Pendente'
                                    )
                                ) = 'pago'
                                THEN 1
                                ELSE 0
                            END
                        ) AS parcelas_pagas,

                        MIN(
                            CASE
                                WHEN LOWER(
                                    COALESCE(
                                        cfp.status,
                                        'Pendente'
                                    )
                                ) <> 'pago'
                                THEN cfp.data_vencimento
                                ELSE NULL
                            END
                        ) AS proxima_parcela

                    FROM pedidos p

                    INNER JOIN conta_fiado_parcelas cfp
                        ON cfp.id_pedido =
                           p.id_pedido

                    LEFT JOIN contas_fiado cf
                        ON cf.id_conta =
                           p.id_conta_fiado

                    LEFT JOIN clientes_fiado c
                        ON c.id_cliente =
                           cf.id_cliente

                    WHERE EXISTS (
                        SELECT 1

                        FROM conta_fiado_parcelas cfp2

                        WHERE cfp2.id_pedido =
                              p.id_pedido

                          AND LOWER(
                              COALESCE(
                                  cfp2.status,
                                  'Pendente'
                              )
                          ) <> 'pago'
                    )

                    GROUP BY
                        p.id_pedido,
                        p.num_pedido,
                        p.id_conta_fiado,
                        p.origem,
                        p.data,
                        p.valor_total,
                        p.form_pag,
                        c.nome_completo

                    ORDER BY
                        proxima_parcela ASC
                    `
                );


            /* ==================================================
               6. CARREGA AS PARCELAS DE CADA COMPRA
            ================================================== */

            for (
                const compra
                of compras
            ) {

                const [
                    parcelasCompra
                ] =
                    await conn.query(
                        `
                        SELECT
                            id_parcela,
                            numero_parcela,
                            total_parcelas,
                            valor,
                            data_vencimento,
                            status,
                            data_pagamento

                        FROM conta_fiado_parcelas

                        WHERE id_pedido = ?

                        ORDER BY
                            numero_parcela ASC
                        `,
                        [
                            compra.id_pedido
                        ]
                    );


                compra.parcelas =
                    parcelasCompra;


                compra.valor_parcela =
                    Number(
                        parcelasCompra[0]?.valor || 0
                    );


                compra.valor_credito =
                    Number(
                        compra.valor_credito || 0
                    );
            }


            /* ==================================================
               7. RETORNA COMPRAS + NOTIFICAÇÕES
            ================================================== */

            return res.json({
                sucesso:
                    true,

                compras,

                notificacoes
            });


        } catch (
            erro
        ) {

            console.error(
                "Erro ao carregar compras parceladas:",
                erro
            );


            return res.status(500).json({
                sucesso:
                    false,

                mensagem:
                    "Erro ao carregar compras parceladas."
            });


        } finally {

            if (
                conn
            ) {
                conn.release();
            }
        }
    }
);
// ==================== HISTÓRICO DE PEDIDOS ====================

router.get(
    "/historico-pedidos",
    verificarToken,
    async (req, res) => {

        try {

            const apenasMeus =
                req.query.apenas_meus === "true";


            const idUserLogado =
                req.user?.id_user ||
                req.user?.id;


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

                    COALESCE(
                        u.nome,
                        'Consumidor Final'
                    ) AS nome

                FROM pedidos p

                LEFT JOIN users u
                    ON p.id_user =
                       u.id_user

                WHERE LOWER(
                    TRIM(
                        COALESCE(
                            p.status,
                            ''
                        )
                    )
                ) = 'finalizado'
            `;


            const params = [];


            if (
                apenasMeus &&
                idUserLogado
            ) {

                queryPedidos += `
                    AND p.id_user = ?
                `;

                params.push(
                    idUserLogado
                );
            }


            queryPedidos += `
                ORDER BY
                    p.data DESC
            `;


            const [
                pedidos
            ] =
                await conexao.execute(
                    queryPedidos,
                    params
                );


            if (
                !pedidos ||
                pedidos.length === 0
            ) {
                return res.json([]);
            }


            const idsPedidos =
                pedidos.map(
                    p =>
                        p.id_pedido
                );


            const placeholders =
                idsPedidos
                    .map(() => "?")
                    .join(",");


            const queryItens = `
                SELECT
                    pi.id_pedido,
                    pi.id_produto,
                    pi.qtd,
                    pi.preco_unitario,

                    COALESCE(
                        prod.nome,
                        'Produto Indisponível'
                    ) AS nome

                FROM pedidos_itens pi

                LEFT JOIN produtos prod
                    ON pi.id_produto =
                       prod.id_produto

                WHERE pi.id_pedido IN (
                    ${placeholders}
                )
            `;


            const [
                itens
            ] =
                await conexao.execute(
                    queryItens,
                    idsPedidos
                );


            const resultadoFinal =
                pedidos.map(
                    pedido => ({
                        ...pedido,

                        itens:
                            itens.filter(
                                item =>
                                    String(
                                        item.id_pedido
                                    ) ===
                                    String(
                                        pedido.id_pedido
                                    )
                            )
                    })
                );


            return res.json(
                resultadoFinal
            );


        } catch (
            error
        ) {

            console.error(
                "Erro ao buscar histórico:",
                error
            );


            return res.status(500).json({
                erro:
                    "Erro ao processar consulta no banco."
            });
        }
    }
);
module.exports = router;
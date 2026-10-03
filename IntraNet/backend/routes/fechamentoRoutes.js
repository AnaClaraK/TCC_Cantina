const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');


/* =========================================================
   VALIDAÇÃO DE DATA
========================================================= */

function validarData(data) {

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            String(data || '')
        )
    ) {

        const erro =
            new Error(
                'Data inválida. Use AAAA-MM-DD.'
            );

        erro.statusCode = 400;

        throw erro;
    }

    return String(data);
}


/* =========================================================
   FORMAS DE PAGAMENTO
========================================================= */

function normalizarForma(texto) {

    return String(texto || '')
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            ''
        )
        .replace(
            /\s*\(F\d+\)\s*/gi,
            ''
        )
        .trim()
        .toUpperCase();
}


function classificarForma(texto) {

    const forma =
        normalizarForma(texto);

    if (
        forma.includes('DINHEIRO')
    ) {
        return 'dinheiro';
    }

    if (
        forma.includes('CREDITO')
    ) {
        return 'credito';
    }

    if (
        forma.includes('DEBITO')
    ) {
        return 'debito';
    }

    if (
        forma === 'PIX' ||
        forma.includes('PIX')
    ) {
        return 'pix';
    }

    if (
        forma.includes('VOUCHER') ||
        forma.includes('TICKET')
    ) {
        return 'voucher';
    }

    if (
        forma.includes('FIADO')
    ) {
        return 'fiado';
    }

    return null;
}


function extrairPagamentos(
    formPag,
    valorTotal
) {

    const texto =
        String(
            formPag || ''
        ).trim();

    const total =
        Number(
            valorTotal || 0
        );

    if (!texto) {

        return {
            outros: total
        };
    }


    /*
        Pagamento dividido.

        Exemplo:

        Dinheiro=2.00,
        Cartão de Crédito=5.00
    */
    if (
        texto.includes('=')
    ) {

        const resultado = {

            dinheiro: 0,
            credito: 0,
            debito: 0,
            pix: 0,
            voucher: 0,
            fiado: 0,
            outros: 0
        };


        texto
            .split(',')
            .map(
                parte =>
                    parte.trim()
            )
            .filter(Boolean)
            .forEach(
                parte => {

                    const pos =
                        parte.lastIndexOf('=');

                    if (
                        pos <= 0
                    ) {

                        resultado.outros +=
                            Number(
                                valorTotal || 0
                            );

                        return;
                    }


                    const forma =
                        parte
                            .slice(
                                0,
                                pos
                            )
                            .trim();


                    const valor =
                        Number(
                            parte
                                .slice(
                                    pos + 1
                                )
                                .trim()
                                .replace(
                                    ',',
                                    '.'
                                )
                        );


                    if (
                        !Number.isFinite(valor) ||
                        valor <= 0
                    ) {
                        return;
                    }


                    const chave =
                        classificarForma(
                            forma
                        );


                    if (chave) {

                        resultado[chave] +=
                            valor;

                    } else {

                        resultado.outros +=
                            valor;
                    }
                }
            );


        return resultado;
    }


    const resultado = {

        dinheiro: 0,
        credito: 0,
        debito: 0,
        pix: 0,
        voucher: 0,
        fiado: 0,
        outros: 0
    };


    const chave =
        classificarForma(
            texto
        );


    if (chave) {

        resultado[chave] =
            total;

    } else {

        resultado.outros =
            total;
    }


    return resultado;
}


/* =========================================================
   DATA ATUAL DO BANCO
========================================================= */

async function obterHojeBanco(
    conn = conexao
) {

    const [linhas] =
        await conn.query(
            `
            SELECT
                DATE_FORMAT(
                    CURDATE(),
                    '%Y-%m-%d'
                ) AS hoje
            `
        );

    return linhas[0].hoje;
}


/* =========================================================
   RESUMO DAS VENDAS DO DIA
========================================================= */

async function buscarResumoDia(
    conn,
    data
) {

    const [vendas] =
        await conn.query(
            `
            SELECT
                id_pedido,
                valor_total,
                form_pag,
                status,
                data
            FROM pedidos
            WHERE DATE(data) = ?
              AND status = 'Finalizado'
            `,
            [data]
        );


    const resumo = {

        quantidade_vendas:
            vendas.length,

        total_vendas:
            0,

        dinheiro:
            0,

        credito:
            0,

        debito:
            0,

        pix:
            0,

        voucher:
            0,

        fiado:
            0,

        outros:
            0
    };


    for (
        const venda of vendas
    ) {

        resumo.total_vendas +=
            Number(
                venda.valor_total || 0
            );


        const pagamentos =
            extrairPagamentos(
                venda.form_pag,
                venda.valor_total
            );


        Object.keys(
            pagamentos
        ).forEach(
            chave => {

                resumo[chave] +=
                    Number(
                        pagamentos[chave] || 0
                    );
            }
        );
    }


    Object.keys(
        resumo
    ).forEach(
        chave => {

            if (
                typeof resumo[chave] ===
                'number'
            ) {

                resumo[chave] =
                    Number(
                        resumo[chave].toFixed(2)
                    );
            }
        }
    );


    return resumo;
}


/* =========================================================
   BUSCA O ÚLTIMO TROCO FECHADO ANTERIOR
========================================================= */

async function buscarTrocoAnterior(
    conn,
    data
) {

    const [linhas] =
        await conn.query(
            `
            SELECT
                data_referencia,
                troco_proximo_dia
            FROM fechamentos_diarios
            WHERE status = 'FECHADO'
              AND data_referencia < ?
            ORDER BY
                data_referencia DESC
            LIMIT 1
            `,
            [data]
        );


    if (
        !linhas.length
    ) {

        return {

            valor:
                0,

            data_origem:
                null,

            primeiro_dia:
                true
        };
    }


    return {

        valor:
            Number(
                linhas[0]
                    .troco_proximo_dia || 0
            ),

        data_origem:
            linhas[0]
                .data_referencia,

        primeiro_dia:
            false
    };
}


/* =========================================================
   BUSCA DIA PENDENTE
========================================================= */

async function buscarPendencia(
    conn,
    hoje
) {

    const [linhas] =
        await conn.query(
            `
            SELECT
                DATE(p.data)
                    AS data_pendente
            FROM pedidos p
            LEFT JOIN
                fechamentos_diarios f
            ON
                f.data_referencia =
                    DATE(p.data)
            WHERE p.status =
                'Finalizado'
              AND DATE(p.data) < ?
              AND f.id_fechamento IS NULL
            GROUP BY
                DATE(p.data)
            ORDER BY
                DATE(p.data) DESC
            LIMIT 1
            `,
            [hoje]
        );


    return (
        linhas[0]?.data_pendente ||
        null
    );
}


/* =========================================================
   BACKUP DO BANCO
   DESTINO:
   backend/config/backups
========================================================= */

async function criarBackupBanco(
    conn,
    dataReferencia
) {

    /*
        Este arquivo fica em:

        backend/routes/fechamentoRoutes.js

        Portanto:

        ..        = backend
        config    = backend/config
        backups   = backend/config/backups
    */

    const pastaBackup =
        path.resolve(
            __dirname,
            '..',
            'config',
            'backups'
        );


    await fs.mkdir(
        pastaBackup,
        {
            recursive: true
        }
    );


    const agora =
        new Date();


    const pad =
        valor =>
            String(valor)
                .padStart(2, '0');


    const ms =
        String(
            agora.getMilliseconds()
        ).padStart(
            3,
            '0'
        );


    const carimbo =
        `${agora.getFullYear()}${pad(agora.getMonth() + 1)}${pad(agora.getDate())}_` +
        `${pad(agora.getHours())}${pad(agora.getMinutes())}${pad(agora.getSeconds())}_${ms}`;


    const nomeArquivo =
        `cantina_fechamento_${dataReferencia}_${carimbo}.sql`;


    const caminhoFinal =
        path.join(
            pastaBackup,
            nomeArquivo
        );


    const caminhoTemporario =
        `${caminhoFinal}.tmp`;


    try {

        const banco =
            process.env.DB_DATABASE;


        if (!banco) {

            throw new Error(
                'DB_DATABASE não foi definido no .env.'
            );
        }


        const [tabelas] =
            await conn.query(
                `
                SELECT
                    TABLE_NAME,
                    TABLE_TYPE
                FROM information_schema.tables
                WHERE TABLE_SCHEMA =
                    DATABASE()
                ORDER BY
                    TABLE_NAME
                `
            );


        let sql = '';


        sql +=
            '-- =====================================================\n';

        sql +=
            '-- BACKUP AUTOMÁTICO DO BANCO CANTINA\n';

        sql +=
            '-- =====================================================\n';

        sql +=
            `-- Fechamento referente ao dia: ${dataReferencia}\n`;

        sql +=
            `-- Backup gerado em: ${agora.toISOString()}\n`;

        sql +=
            '-- Destino: backend/config/backups\n';

        sql +=
            '-- =====================================================\n\n';


        sql +=
            'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n';

        sql +=
            'SET FOREIGN_KEY_CHECKS = 0;\n';

        sql +=
            'SET UNIQUE_CHECKS = 0;\n';

        sql +=
            'SET NAMES utf8mb4;\n\n';


        sql +=
            `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(banco)} ` +
            `CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;\n`;


        sql +=
            `USE ${mysql.escapeId(banco)};\n\n`;


        const views = [];


        /* =====================================================
           TABELAS
        ===================================================== */

        for (
            const tabela of tabelas
        ) {

            const nomeTabela =
                tabela.TABLE_NAME;


            const tipo =
                String(
                    tabela.TABLE_TYPE || ''
                ).toUpperCase();


            if (
                tipo === 'VIEW'
            ) {

                views.push(
                    nomeTabela
                );

                continue;
            }


            const nomeSeguro =
                mysql.escapeId(
                    nomeTabela
                );


            const [definicaoRows] =
                await conn.query(
                    `SHOW CREATE TABLE ${nomeSeguro}`
                );


            const definicao =
                definicaoRows[0];


            const chaveCreate =
                Object.keys(
                    definicao || {}
                ).find(
                    chave =>
                        chave.toLowerCase() ===
                        'create table'
                );


            if (
                !chaveCreate
            ) {

                throw new Error(
                    `Não foi possível obter a estrutura da tabela ${nomeTabela}.`
                );
            }


            sql +=
                `DROP TABLE IF EXISTS ${nomeSeguro};\n`;


            sql +=
                `${definicao[chaveCreate]};\n\n`;


            const [linhas] =
                await conn.query(
                    `SELECT * FROM ${nomeSeguro}`
                );


            if (
                !linhas.length
            ) {
                continue;
            }


            const colunas =
                Object.keys(
                    linhas[0]
                )
                .map(
                    coluna =>
                        mysql.escapeId(
                            coluna
                        )
                )
                .join(', ');


            const valores =
                linhas.map(
                    linha => {

                        const listaValores =
                            Object.keys(
                                linhas[0]
                            )
                            .map(
                                coluna =>
                                    mysql.escape(
                                        linha[coluna]
                                    )
                            );


                        return (
                            `(${listaValores.join(', ')})`
                        );
                    }
                );


            sql +=
                `INSERT INTO ${nomeSeguro} (${colunas}) VALUES\n`;


            sql +=
                `${valores.join(',\n')};\n\n`;
        }


        /* =====================================================
           VIEWS
        ===================================================== */

        for (
            const nomeView of views
        ) {

            const nomeSeguro =
                mysql.escapeId(
                    nomeView
                );


            const [definicaoRows] =
                await conn.query(
                    `SHOW CREATE VIEW ${nomeSeguro}`
                );


            const definicao =
                definicaoRows[0];


            const chaveCreate =
                Object.keys(
                    definicao || {}
                ).find(
                    chave =>
                        chave.toLowerCase() ===
                        'create view'
                );


            if (
                !chaveCreate
            ) {

                throw new Error(
                    `Não foi possível obter a definição da view ${nomeView}.`
                );
            }


            sql +=
                `DROP VIEW IF EXISTS ${nomeSeguro};\n`;


            sql +=
                `${definicao[chaveCreate]};\n\n`;
        }


        sql +=
            'SET UNIQUE_CHECKS = 1;\n';

        sql +=
            'SET FOREIGN_KEY_CHECKS = 1;\n';


        /*
            Primeiro cria .tmp
        */
        await fs.writeFile(
            caminhoTemporario,
            sql,
            'utf8'
        );


        /*
            Depois renomeia para .sql
        */
        await fs.rename(
            caminhoTemporario,
            caminhoFinal
        );


        return {

            sucesso:
                true,

            nome_arquivo:
                nomeArquivo,

            caminho:
                caminhoFinal
        };

    } catch (erro) {

        try {

            await fs.unlink(
                caminhoTemporario
            );

        } catch (_) {
            // Pode não existir.
        }


        throw erro;
    }
}


/* =========================================================
   STATUS INICIAL
========================================================= */

router.get(
    '/fechamentos-diarios/status-inicial',
    verificarToken,
    async (
        req,
        res
    ) => {

        try {

            const hoje =
                await obterHojeBanco();


            const pendencia =
                await buscarPendencia(
                    conexao,
                    hoje
                );


            const abertura =
                await buscarTrocoAnterior(
                    conexao,
                    hoje
                );


            return res.json({

                sucesso:
                    true,

                hoje,

                data_pendente:
                    pendencia,

                troco_inicial_hoje:
                    abertura.valor,

                origem_troco:
                    abertura.data_origem,

                primeiro_dia:
                    abertura.primeiro_dia
            });

        } catch (erro) {

            console.error(
                'Erro no status inicial do fechamento:',
                erro
            );


            return res.status(
                500
            ).json({

                sucesso:
                    false,

                resposta:
                    'Não foi possível verificar o fechamento diário.'
            });
        }
    }
);


/* =========================================================
   CONSULTAR FECHAMENTO DE UMA DATA
========================================================= */

router.get(
    '/fechamentos-diarios/:data',
    verificarToken,
    async (
        req,
        res
    ) => {

        try {

            const data =
                validarData(
                    req.params.data
                );


            const hoje =
                await obterHojeBanco();


            if (
                data > hoje
            ) {

                return res.status(
                    400
                ).json({

                    sucesso:
                        false,

                    resposta:
                        'Não é possível consultar um dia futuro.'
                });
            }


            const [linhas] =
                await conexao.query(
                    `
                    SELECT *
                    FROM fechamentos_diarios
                    WHERE data_referencia = ?
                    LIMIT 1
                    `,
                    [data]
                );


            const fechamento =
                linhas[0] ||
                null;


            const resumo =
                await buscarResumoDia(
                    conexao,
                    data
                );


            const abertura =
                await buscarTrocoAnterior(
                    conexao,
                    data
                );


            return res.json({

                sucesso:
                    true,

                data_referencia:
                    data,

                fechamento,

                resumo,

                troco_inicial:
                    fechamento
                        ? Number(
                            fechamento.troco_inicial || 0
                        )
                        : abertura.valor,

                origem_troco_inicial:
                    fechamento
                        ? fechamento.data_origem_troco
                        : abertura.data_origem,

                primeiro_dia:
                    abertura.primeiro_dia,

                pode_fechar:
                    !fechamento
            });

        } catch (erro) {

            console.error(
                'Erro ao consultar fechamento:',
                erro
            );


            return res.status(
                erro.statusCode || 500
            ).json({

                sucesso:
                    false,

                resposta:
                    erro.message ||
                    'Não foi possível consultar o fechamento.'
            });
        }
    }
);


/* =========================================================
   ABERTURA DO CAIXA
   AGORA ACEITA HOJE OU QUALQUER DIA ANTERIOR
========================================================= */

router.post(
    '/fechamentos-diarios/abertura',
    verificarToken,
    async (
        req,
        res
    ) => {

        const conn =
            await conexao.getConnection();


        try {

            const data =
                validarData(
                    req.body.data_referencia
                );


            const hoje =
                await obterHojeBanco();


            /*
                CORREÇÃO PRINCIPAL:

                Antes:
                    data !== hoje -> erro

                Agora:
                    data > hoje -> erro

                Portanto:
                    hoje       -> permitido
                    ontem      -> permitido
                    dias atrás -> permitido
                    futuro     -> bloqueado
            */
            if (
                data > hoje
            ) {

                const erro =
                    new Error(
                        'Não é possível abrir um dia futuro.'
                    );

                erro.statusCode =
                    400;

                throw erro;
            }


            const trocoInicial =
                Number(
                    String(
                        req.body.troco_inicial ?? ''
                    ).replace(
                        ',',
                        '.'
                    )
                );


            if (
                !Number.isFinite(
                    trocoInicial
                ) ||
                trocoInicial < 0
            ) {

                const erro =
                    new Error(
                        'Informe um valor válido para o troco inicial.'
                    );

                erro.statusCode =
                    400;

                throw erro;
            }


            await conn.beginTransaction();


            const [existente] =
                await conn.query(
                    `
                    SELECT *
                    FROM fechamentos_diarios
                    WHERE data_referencia = ?
                    FOR UPDATE
                    `,
                    [data]
                );


            /*
                Se já está FECHADO,
                não pode abrir novamente.
            */
            if (
                existente.length &&
                existente[0].status ===
                    'FECHADO'
            ) {

                const erro =
                    new Error(
                        `O dia ${data} já está fechado e não pode ser aberto novamente.`
                    );

                erro.statusCode =
                    409;

                throw erro;
            }


            /*
                Busca a origem do troco,
                caso exista um fechamento anterior.
            */
            const aberturaAnterior =
                await buscarTrocoAnterior(
                    conn,
                    data
                );


            /*
                Se já existe registro ABERTO,
                apenas atualiza o troco informado.
            */
            if (
                existente.length
            ) {

                await conn.query(
                    `
                    UPDATE fechamentos_diarios
                    SET
                        troco_inicial = ?,
                        data_origem_troco = ?,
                        id_user_abertura = ?
                    WHERE
                        id_fechamento = ?
                    `,
                    [

                        trocoInicial,

                        aberturaAnterior.data_origem,

                        req.usuarioId ||
                            null,

                        existente[0]
                            .id_fechamento
                    ]
                );

            } else {

                /*
                    Cria a abertura para a data escolhida.

                    Isso agora funciona também para
                    dias anteriores.
                */
                await conn.query(
                    `
                    INSERT INTO
                        fechamentos_diarios
                    (
                        data_referencia,
                        id_user_abertura,
                        troco_inicial,
                        data_origem_troco,
                        status
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        'ABERTO'
                    )
                    `,
                    [

                        data,

                        req.usuarioId ||
                            null,

                        trocoInicial,

                        aberturaAnterior
                            .data_origem
                    ]
                );
            }


            await conn.commit();


            return res.status(
                201
            ).json({

                sucesso:
                    true,

                mensagem:
                    `Abertura de ${data} registrada com sucesso.`,

                data_referencia:
                    data,

                troco_inicial:
                    trocoInicial,

                origem_troco:
                    aberturaAnterior
                        .data_origem
            });

        } catch (erro) {

            await conn.rollback();


            console.error(
                'Erro na abertura do caixa:',
                erro
            );


            return res.status(
                erro.statusCode || 500
            ).json({

                sucesso:
                    false,

                resposta:
                    erro.message ||
                    'Não foi possível registrar a abertura do caixa.'
            });

        } finally {

            conn.release();
        }
    }
);


/* =========================================================
   FECHAR DIA + BACKUP
========================================================= */

router.post(
    '/fechamentos-diarios',
    verificarToken,
    async (
        req,
        res
    ) => {

        const conn =
            await conexao.getConnection();


        let caminhoBackupCriado =
            null;


        try {

            const data =
                validarData(
                    req.body.data_referencia
                );


            const hoje =
                await obterHojeBanco();


            if (
                data > hoje
            ) {

                const erro =
                    new Error(
                        'Não é possível fechar um dia futuro.'
                    );

                erro.statusCode =
                    400;

                throw erro;
            }


            const trocoProximoDia =
                Number(
                    String(
                        req.body.troco_proximo_dia ?? ''
                    ).replace(
                        ',',
                        '.'
                    )
                );


            if (
                !Number.isFinite(
                    trocoProximoDia
                ) ||
                trocoProximoDia < 0
            ) {

                const erro =
                    new Error(
                        'Informe um valor válido para o troco que ficará para o próximo dia.'
                    );

                erro.statusCode =
                    400;

                throw erro;
            }


            await conn.beginTransaction();


            const [existente] =
                await conn.query(
                    `
                    SELECT *
                    FROM fechamentos_diarios
                    WHERE data_referencia = ?
                    FOR UPDATE
                    `,
                    [data]
                );


            if (
                existente.length &&
                existente[0].status ===
                    'FECHADO'
            ) {

                const erro =
                    new Error(
                        'Este dia já está fechado.'
                    );

                erro.statusCode =
                    409;

                throw erro;
            }


            /*
                Não deixa fechar um dia anterior
                depois que já existe um fechamento
                posterior.
            */
            const [posterior] =
                await conn.query(
                    `
                    SELECT
                        data_referencia
                    FROM fechamentos_diarios
                    WHERE data_referencia > ?
                    ORDER BY
                        data_referencia ASC
                    LIMIT 1
                    `,
                    [data]
                );


            if (
                posterior.length
            ) {

                const erro =
                    new Error(
                        `O dia ${data} não pode ser fechado agora porque já existe um fechamento posterior (${posterior[0].data_referencia}).`
                    );

                erro.statusCode =
                    409;

                throw erro;
            }


            const resumo =
                await buscarResumoDia(
                    conn,
                    data
                );


            const abertura =
                existente.length

                    ? {

                        valor:
                            Number(
                                existente[0]
                                    .troco_inicial || 0
                            ),

                        data_origem:
                            existente[0]
                                .data_origem_troco

                    }

                    : await buscarTrocoAnterior(
                        conn,
                        data
                    );


            const dinheiroEsperado =
                Number(
                    (
                        abertura.valor +
                        resumo.dinheiro
                    ).toFixed(2)
                );


            const diferenca =
                Number(
                    (
                        trocoProximoDia -
                        dinheiroEsperado
                    ).toFixed(2)
                );


            /* =====================================================
               SALVA O FECHAMENTO
            ===================================================== */

            if (
                existente.length
            ) {

                await conn.query(
                    `
                    UPDATE
                        fechamentos_diarios
                    SET

                        id_user_fechamento = ?,

                        total_vendas = ?,

                        total_dinheiro = ?,

                        total_credito = ?,

                        total_debito = ?,

                        total_pix = ?,

                        total_voucher = ?,

                        total_fiado = ?,

                        total_outros = ?,

                        quantidade_vendas = ?,

                        dinheiro_esperado = ?,

                        troco_proximo_dia = ?,

                        diferenca_caixa = ?,

                        status = 'FECHADO',

                        fechado_em = NOW()

                    WHERE
                        id_fechamento = ?
                    `,
                    [

                        req.usuarioId ||
                            null,

                        resumo.total_vendas,

                        resumo.dinheiro,

                        resumo.credito,

                        resumo.debito,

                        resumo.pix,

                        resumo.voucher,

                        resumo.fiado,

                        resumo.outros,

                        resumo.quantidade_vendas,

                        dinheiroEsperado,

                        trocoProximoDia,

                        diferenca,

                        existente[0]
                            .id_fechamento
                    ]
                );

            } else {

                await conn.query(
                    `
                    INSERT INTO
                        fechamentos_diarios
                    (
                        data_referencia,
                        id_user_abertura,
                        id_user_fechamento,
                        troco_inicial,
                        data_origem_troco,
                        total_vendas,
                        total_dinheiro,
                        total_credito,
                        total_debito,
                        total_pix,
                        total_voucher,
                        total_fiado,
                        total_outros,
                        quantidade_vendas,
                        dinheiro_esperado,
                        troco_proximo_dia,
                        diferenca_caixa,
                        status,
                        fechado_em
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'FECHADO',
                        NOW()
                    )
                    `,
                    [

                        data,

                        req.usuarioId ||
                            null,

                        req.usuarioId ||
                            null,

                        abertura.valor,

                        abertura.data_origem,

                        resumo.total_vendas,

                        resumo.dinheiro,

                        resumo.credito,

                        resumo.debito,

                        resumo.pix,

                        resumo.voucher,

                        resumo.fiado,

                        resumo.outros,

                        resumo.quantidade_vendas,

                        dinheiroEsperado,

                        trocoProximoDia,

                        diferenca
                    ]
                );
            }


            /* =====================================================
               BACKUP AUTOMÁTICO
               backend/config/backups
            ===================================================== */

            const backup =
                await criarBackupBanco(
                    conn,
                    data
                );


            caminhoBackupCriado =
                backup.caminho;


            /*
                O commit só acontece depois
                que o backup terminou.
            */
            await conn.commit();


            return res.status(
                201
            ).json({

                sucesso:
                    true,

                mensagem:
                    `Fechamento de ${data} realizado com sucesso.`,

                data_referencia:
                    data,

                resumo,

                troco_inicial:
                    abertura.valor,

                dinheiro_esperado:
                    dinheiroEsperado,

                troco_proximo_dia:
                    trocoProximoDia,

                diferenca_caixa:
                    diferenca,

                backup_sucesso:
                    true,

                backup_arquivo:
                    backup.nome_arquivo
            });

        } catch (erro) {

            /*
                Se falhar o fechamento OU o backup,
                desfaz a transação.
            */
            await conn.rollback();


            /*
                Remove o backup se ele chegou
                a ser criado antes do commit.
            */
            if (
                caminhoBackupCriado
            ) {

                try {

                    await fs.unlink(
                        caminhoBackupCriado
                    );

                } catch (_) {
                    // Pode não existir.
                }
            }


            console.error(
                'Erro ao salvar fechamento:',
                erro
            );


            return res.status(
                erro.statusCode || 500
            ).json({

                sucesso:
                    false,

                resposta:
                    erro.message ||
                    'Não foi possível salvar o fechamento.'
            });

        } finally {

            conn.release();
        }
    }
);


module.exports = router;
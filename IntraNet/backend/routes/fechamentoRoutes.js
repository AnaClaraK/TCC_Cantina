const express = require("express");
const router = express.Router();

const conexao = require("../db");
const verificarToken = require("../middlewares/auth");

async function garantirTabela() {
    await conexao.query(`
        CREATE TABLE IF NOT EXISTS fechamentos_diarios (
            id_fechamento INT NOT NULL AUTO_INCREMENT,
            data_referencia DATE NOT NULL,
            troco_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
            troco_proximo_dia DECIMAL(12,2) NULL,
            dinheiro_esperado DECIMAL(12,2) NULL,
            diferenca_caixa DECIMAL(12,2) NULL,
            status ENUM('ABERTO','FECHADO') NOT NULL DEFAULT 'ABERTO',
            data_fechamento DATETIME NULL,

            PRIMARY KEY (id_fechamento),
            UNIQUE KEY uk_fechamento_data (data_referencia)
        )
    `);
}

function dataHoje() {
    const agora = new Date();

    return `${agora.getFullYear()}-${String(
        agora.getMonth() + 1
    ).padStart(2, "0")}-${String(
        agora.getDate()
    ).padStart(2, "0")}`;
}

function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
}

function normalizarFormaPagamento(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s*\(F\d+\)/gi, "")
        .trim()
        .toLowerCase();
}

function somarPagamento(resumo, forma, valor) {

    const n = numero(valor);
    const f = normalizarFormaPagamento(forma);

    if (f.includes("dinheiro")) {
        resumo.dinheiro += n;

    } else if (f.includes("credito")) {
        resumo.credito += n;

    } else if (f.includes("debito")) {
        resumo.debito += n;

    } else if (f.includes("pix")) {
        resumo.pix += n;

    } else if (
        f.includes("voucher") ||
        f.includes("ticket")
    ) {
        resumo.voucher += n;

    } else if (f.includes("fiado")) {
        resumo.fiado += n;

    } else {
        resumo.outros += n;
    }
}

function calcularResumo(pedidos) {

    const resumo = {
        dinheiro: 0,
        credito: 0,
        debito: 0,
        pix: 0,
        voucher: 0,
        fiado: 0,
        outros: 0,
        total_vendas: 0,
        quantidade_vendas: pedidos.length
    };

    for (const pedido of pedidos) {

        const total = numero(
            pedido.valor_total
        );

        resumo.total_vendas += total;

        const forma =
            String(pedido.form_pag || "").trim();

        /*
         * PAGAMENTO NORMAL
         */
        if (!forma.includes("=")) {

            somarPagamento(
                resumo,
                forma,
                total
            );

            continue;
        }

        /*
         * PAGAMENTO DIVIDIDO
         *
         * Exemplo:
         * Dinheiro=10.00, PIX=5.00
         */
        const partes = forma.split(",");

        let valorInterpretado = 0;

        for (const parte of partes) {

            const separador =
                parte.lastIndexOf("=");

            if (separador === -1) {
                continue;
            }

            const metodo =
                parte.slice(
                    0,
                    separador
                ).trim();

            const valor =
                numero(
                    parte
                        .slice(separador + 1)
                        .trim()
                        .replace(",", ".")
                );

            somarPagamento(
                resumo,
                metodo,
                valor
            );

            valorInterpretado += valor;
        }

        if (
            valorInterpretado <
            total - 0.009
        ) {

            resumo.outros +=
                total - valorInterpretado;
        }
    }

    for (const chave of Object.keys(resumo)) {

        if (
            chave !==
            "quantidade_vendas"
        ) {

            resumo[chave] =
                Number(
                    resumo[chave].toFixed(2)
                );
        }
    }

    return resumo;
}

async function buscarResumoDia(data) {

    const [pedidos] =
        await conexao.query(`
            SELECT
                id_pedido,
                valor_total,
                form_pag
            FROM pedidos
            WHERE status = 'Finalizado'
              AND DATE(data) = ?
            ORDER BY data ASC,
                     id_pedido ASC
        `, [data]);

    return calcularResumo(pedidos);
}

async function buscarFechamento(data) {

    const [rows] =
        await conexao.query(`
            SELECT *
            FROM fechamentos_diarios
            WHERE data_referencia = ?
            LIMIT 1
        `, [data]);

    return rows[0] || null;
}

async function buscarTrocoAnterior(data) {

    const [rows] =
        await conexao.query(`
            SELECT
                data_referencia,
                troco_proximo_dia
            FROM fechamentos_diarios
            WHERE data_referencia < ?
              AND status = 'FECHADO'
            ORDER BY data_referencia DESC
            LIMIT 1
        `, [data]);

    return rows[0] || null;
}


/* =====================================================
   STATUS INICIAL
===================================================== */

router.get(
    "/fechamentos-diarios/status-inicial",
    verificarToken,
    async (req, res) => {

        try {

            await garantirTabela();

            const hoje =
                dataHoje();

            const [pendentes] =
                await conexao.query(`
                    SELECT data_referencia
                    FROM fechamentos_diarios
                    WHERE status = 'ABERTO'
                      AND data_referencia < ?
                    ORDER BY data_referencia ASC
                    LIMIT 1
                `, [hoje]);

            return res.json({
                sucesso: true,
                hoje,
                data_pendente:
                    pendentes[0]?.data_referencia ||
                    null
            });

        } catch (erro) {

            console.error(
                "Erro no status inicial:",
                erro
            );

            return res.status(500).json({
                resposta:
                    erro.message ||
                    "Não foi possível verificar o fechamento."
            });
        }
    }
);


/* =====================================================
   CONSULTAR DIA
===================================================== */

router.get(
    "/fechamentos-diarios/:data",
    verificarToken,
    async (req, res) => {

        try {

            await garantirTabela();

            const data =
                req.params.data;

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(data)
            ) {

                return res.status(400).json({
                    resposta: "Data inválida."
                });
            }

            const fechamento =
                await buscarFechamento(data);

            const anterior =
                await buscarTrocoAnterior(data);

            const resumo =
                await buscarResumoDia(data);

            const trocoInicial =
                fechamento
                    ? numero(
                        fechamento.troco_inicial
                    )
                    : numero(
                        anterior?.troco_proximo_dia
                    );

            const primeiroDia =
                !fechamento &&
                !anterior;

            const dinheiroEsperado =
                fechamento
                    ? numero(
                        fechamento.dinheiro_esperado
                    )
                    : Number(
                        (
                            trocoInicial +
                            resumo.dinheiro
                        ).toFixed(2)
                    );

            return res.json({

                sucesso: true,

                data_referencia:
                    data,

                primeiro_dia:
                    primeiroDia,

                origem_troco_inicial:
                    anterior?.data_referencia ||
                    null,

                troco_inicial:
                    trocoInicial,

                dinheiro_esperado:
                    dinheiroEsperado,

                pode_fechar:
                    fechamento?.status !==
                    "FECHADO",

                resumo,

                fechamento
            });

        } catch (erro) {

            console.error(
                "Erro ao consultar fechamento:",
                erro
            );

            return res.status(500).json({
                resposta:
                    erro.message ||
                    "Não foi possível carregar o fechamento."
            });
        }
    }
);


/* =====================================================
   ABERTURA
===================================================== */

router.post(
    "/fechamentos-diarios/abertura",
    verificarToken,
    async (req, res) => {

        try {

            await garantirTabela();

            const data =
                String(
                    req.body.data_referencia ||
                    ""
                );

            const trocoInicial =
                numero(
                    req.body.troco_inicial
                );

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(data)
            ) {

                return res.status(400).json({
                    resposta: "Data inválida."
                });
            }

            if (trocoInicial < 0) {

                return res.status(400).json({
                    resposta:
                        "Troco inicial inválido."
                });
            }

            const atual =
                await buscarFechamento(data);

            if (
                atual?.status ===
                "FECHADO"
            ) {

                return res.status(400).json({
                    resposta:
                        "Este dia já está fechado."
                });
            }

            if (atual) {

                await conexao.query(`
                    UPDATE fechamentos_diarios
                    SET
                        troco_inicial = ?,
                        status = 'ABERTO'
                    WHERE data_referencia = ?
                `, [
                    trocoInicial,
                    data
                ]);

            } else {

                await conexao.query(`
                    INSERT INTO
                        fechamentos_diarios
                    (
                        data_referencia,
                        troco_inicial,
                        status
                    )
                    VALUES (?, ?, 'ABERTO')
                `, [
                    data,
                    trocoInicial
                ]);
            }

            return res.json({
                sucesso: true,
                data_referencia: data,
                troco_inicial: trocoInicial
            });

        } catch (erro) {

            console.error(
                "Erro ao abrir caixa:",
                erro
            );

            return res.status(500).json({
                resposta:
                    erro.message ||
                    "Não foi possível abrir o caixa."
            });
        }
    }
);


/* =====================================================
   FECHAMENTO
===================================================== */

router.post(
    "/fechamentos-diarios",
    verificarToken,
    async (req, res) => {

        try {

            await garantirTabela();

            const data =
                String(
                    req.body.data_referencia ||
                    ""
                );

            const trocoProximo =
                numero(
                    req.body.troco_proximo_dia
                );

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(data)
            ) {

                return res.status(400).json({
                    resposta: "Data inválida."
                });
            }

            if (trocoProximo < 0) {

                return res.status(400).json({
                    resposta:
                        "Troco para o próximo dia inválido."
                });
            }

            let fechamento =
                await buscarFechamento(data);

            if (!fechamento) {

                const anterior =
                    await buscarTrocoAnterior(data);

                const trocoInicial =
                    numero(
                        anterior?.troco_proximo_dia
                    );

                await conexao.query(`
                    INSERT INTO
                        fechamentos_diarios
                    (
                        data_referencia,
                        troco_inicial,
                        status
                    )
                    VALUES (?, ?, 'ABERTO')
                `, [
                    data,
                    trocoInicial
                ]);

                fechamento =
                    await buscarFechamento(data);
            }

            if (
                fechamento.status ===
                "FECHADO"
            ) {

                return res.status(400).json({
                    resposta:
                        "Este dia já está fechado."
                });
            }

            const resumo =
                await buscarResumoDia(data);

            const trocoInicial =
                numero(
                    fechamento.troco_inicial
                );

            const dinheiroEsperado =
                Number(
                    (
                        trocoInicial +
                        resumo.dinheiro
                    ).toFixed(2)
                );

            const diferenca =
                Number(
                    (
                        trocoProximo -
                        dinheiroEsperado
                    ).toFixed(2)
                );

            await conexao.query(`
                UPDATE fechamentos_diarios
                SET
                    troco_proximo_dia = ?,
                    dinheiro_esperado = ?,
                    diferenca_caixa = ?,
                    status = 'FECHADO',
                    data_fechamento = NOW()
                WHERE data_referencia = ?
            `, [
                trocoProximo,
                dinheiroEsperado,
                diferenca,
                data
            ]);

            return res.json({

                sucesso: true,

                data_referencia:
                    data,

                troco_proximo_dia:
                    trocoProximo,

                dinheiro_esperado:
                    dinheiroEsperado,

                diferenca_caixa:
                    diferenca,

                resumo
            });

        } catch (erro) {

            console.error(
                "Erro ao fechar dia:",
                erro
            );

            return res.status(500).json({
                resposta:
                    erro.message ||
                    "Não foi possível fechar o dia."
            });
        }
    }
);


module.exports = router;
const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');
const {
    garantirTabelaControleApp,
    obterIdUsuarioToken,
    obterBloqueioApp
} = require('../utils/controlePedidosApp');

function exigirFuncionarioIntranet(req, res, next) {
    const identidades = [req.usuario, req.user].filter(Boolean);
    const tokenDeClienteApp = identidades.some(identidade =>
        identidade.id_user !== undefined && identidade.id_cadastro === undefined
    );
    const idFuncionario = identidades
        .map(identidade => identidade.id_cadastro ?? identidade.id)
        .find(id => id !== undefined && id !== null);

    if (tokenDeClienteApp || !Number.isInteger(Number(idFuncionario)) || Number(idFuncionario) <= 0) {
        return res.status(403).json({
            sucesso: false,
            erro: 'Acesso permitido somente pela Intranet.'
        });
    }

    next();
}

function dataHoraParaMensagem(valor) {
    if (!valor) return "horário não informado";
    const data = new Date(String(valor).replace(" ", "T"));
    if (Number.isNaN(data.getTime())) return String(valor);
    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// criar agendamento //
router.post("/agendamento", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        await garantirTabelaControleApp(conexao);
        await conn.beginTransaction();

        const {
            id_user,
            data_ag,
            valor_total,
            qtd_total,
            form_pag,
            itens
        } = req.body;

        const [ultimo] = await conn.query("SELECT MAX(num_pedido) AS max_num FROM pedidos");
        const num_pedido = (ultimo[0].max_num || 0) + 1;

        const [resPedido] = await conn.query(
            `INSERT INTO pedidos (
                id_user, num_pedido, data, data_ag, status, origem, valor_total, qtd_total, form_pag
            ) VALUES (?, ?, NOW(), ?, 'Agendado', 'SITE', ?, ?, ?)`,
            [id_user, num_pedido, data_ag, valor_total, qtd_total, form_pag]
        );

        const id_pedido = resPedido.insertId;

        for (const item of itens) {
            const [prod] = await conn.query(
                "SELECT nome, qtd, ativo FROM produtos WHERE id_produto = ? FOR UPDATE",
                [item.id_produto]
            );

            if (prod.length === 0) {
                throw new Error(`Produto ID ${item.id_produto} não encontrado.`);
            }

            if (Number(prod[0].ativo) !== 1) {
                throw new Error(`O produto "${prod[0].nome}" está inativo e não pode ser agendado.`);
            }

            const disponivel = Number(prod[0].qtd || 0);
            if (disponivel < item.qtd) {
                throw new Error(`Estoque insuficiente para "${prod[0].nome}".`);
            }

            await conn.query(
                `INSERT INTO pedidos_itens (
                    id_pedido, id_produto, qtd, preco_unitario
                ) VALUES (?, ?, ?, ?)`,
                [id_pedido, item.id_produto, item.qtd, item.preco_unitario]
            );
        }

        await conn.commit();
        return res.status(201).json({
            sucesso: true,
            mensagem: "Agendamento criado com sucesso!",
            id_pedido,
            num_pedido
        });
    } catch (erro) {
        await conn.rollback();
        console.error("Erro ao criar agendamento:", erro);
        return res.status(400).json({
            sucesso: false,
            erro: erro.message || "Erro ao criar agendamento."
        });
    } finally {
        conn.release();
    }
});

// finalizar agendamento //
router.put("/agendamento/:id/finalizar", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        await conn.beginTransaction();

        const id_pedido = req.params.id;

        const [itens] = await conn.query(
            "SELECT id_produto, qtd FROM pedidos_itens WHERE id_pedido = ?",
            [id_pedido]
        );

        for (const item of itens) {
            await conn.query(
                "UPDATE produtos SET qtd = qtd - ? WHERE id_produto = ?",
                [item.qtd, item.id_produto]
            );
        }

        await conn.query(
            "UPDATE pedidos SET status = 'Finalizado', data = NOW() WHERE id_pedido = ?",
            [id_pedido]
        );

        await conn.commit();
        return res.json({ sucesso: true, mensagem: "Agendamento finalizado com sucesso!" });
    } catch (erro) {
        await conn.rollback();
        console.error("Erro ao finalizar agendamento:", erro);
        return res.status(500).json({ erro: "Erro ao finalizar agendamento." });
    } finally {
        conn.release();
    }
});

// cancelar agendamento //
router.put("/agendamento/:id/cancelar", verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        await conn.beginTransaction();

        const id_pedido = req.params.id;

        await conn.query(
            "UPDATE pedidos SET status = 'Cancelado' WHERE id_pedido = ?",
            [id_pedido]
        );

        await conn.commit();
        return res.json({ sucesso: true, mensagem: "Agendamento cancelado com sucesso!" });
    } catch (erro) {
        await conn.rollback();
        console.error("Erro ao cancelar agendamento:", erro);
        return res.status(500).json({ erro: "Erro ao cancelar agendamento." });
    } finally {
        conn.release();
    }
});

// listar agendamentos //
router.get("/agendamento", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT 
                p.id_pedido,
                p.num_pedido,
                p.data,
                p.data_ag,
                p.valor_total,
                p.qtd_total,
                p.form_pag,
                p.status,
                p.origem,
                u.nome AS cliente_nome,
                i.id_produto,
                pr.nome AS produto_nome,
                i.qtd,
                i.preco_unitario
            FROM pedidos p
            LEFT JOIN users u ON p.id_user = u.id_user
            LEFT JOIN pedidos_itens i ON p.id_pedido = i.id_pedido
            LEFT JOIN produtos pr ON i.id_produto = pr.id_produto
            WHERE LOWER(TRIM(p.status)) = 'agendado'
               OR (LOWER(TRIM(p.status)) = 'pendente' AND LOWER(TRIM(p.origem)) = 'app')
            ORDER BY COALESCE(p.data_ag, p.data) ASC, p.num_pedido ASC
        `);

        const pedidosMap = {};

        rows.forEach(r => {
            if (!pedidosMap[r.id_pedido]) {
                pedidosMap[r.id_pedido] = {
                    id_pedido: r.id_pedido,
                    num_pedido: r.num_pedido,
                    data: r.data,
                    data_ag: r.data_ag,
                    valor_total: r.valor_total,
                    qtd_total: r.qtd_total,
                    form_pag: r.form_pag,
                    status: r.status,
                    origem: r.origem,
                    cliente_nome: r.cliente_nome,
                    produtos: []
                };
            }

            if (r.id_produto) {
                pedidosMap[r.id_pedido].produtos.push({
                    id_produto: r.id_produto,
                    nome: r.produto_nome,
                    qtd: r.qtd,
                    preco: r.preco_unitario
                });
            }
        });

        return res.json(Object.values(pedidosMap));
    } catch (erro) {
        console.error("Erro ao buscar agendamentos:", erro);
        return res.status(500).json({ erro: "Erro ao buscar agendamentos" });
    }
});

// listar clientes app no agendamento //
router.get("/agendamento/clientes-app", verificarToken, exigirFuncionarioIntranet, async (req, res) => {
    try {
        await garantirTabelaControleApp(conexao);

        const diasSolicitados = Number.parseInt(req.query.dias, 10);
        const dias = [1, 2].includes(diasSolicitados) ? diasSolicitados : 2;

        await conexao.query(`
            UPDATE app_pedidos_nao_retirados c
            INNER JOIN pedidos p ON p.id_pedido = c.id_pedido
            SET c.regularizado = 1,
                c.bloqueado = 0,
                c.aviso_app_pendente = 0,
                c.data_atualizacao = NOW()
            WHERE c.regularizado = 0
              AND LOWER(TRIM(COALESCE(p.status, ''))) NOT IN ('agendado', 'pendente')
        `);

        const [pedidosVencidos] = await conexao.query(`
            SELECT
                p.id_pedido,
                p.id_user,
                p.num_pedido,
                p.data_ag,
                p.status,
                p.valor_total,
                p.qtd_total,
                u.nome AS cliente_nome,
                u.email AS cliente_email,
                GROUP_CONCAT(
                    DISTINCT CONCAT(
                        COALESCE(pr.nome, 'Produto'),
                        ' (', i.qtd, 'x)'
                    )
                    ORDER BY pr.nome
                    SEPARATOR ', '
                ) AS produtos,
                DATEDIFF(CURDATE(), DATE(p.data_ag)) AS dias_atraso
            FROM pedidos p
            INNER JOIN users u ON u.id_user = p.id_user
            LEFT JOIN pedidos_itens i ON i.id_pedido = p.id_pedido
            LEFT JOIN produtos pr ON pr.id_produto = i.id_produto
            WHERE UPPER(TRIM(COALESCE(p.origem, ''))) = 'APP'
              AND LOWER(TRIM(COALESCE(p.status, ''))) IN ('agendado', 'pendente')
              AND p.id_user IS NOT NULL
              AND p.data_ag >= '2000-01-01 00:00:00'
              AND p.data_ag < DATE_SUB(NOW(), INTERVAL ${dias} DAY)
            GROUP BY
                p.id_pedido, p.id_user, p.num_pedido, p.data_ag,
                p.status, p.valor_total, p.qtd_total, u.nome, u.email
            ORDER BY p.data_ag ASC, p.num_pedido ASC
        `);

        for (const pedido of pedidosVencidos) {
            const mensagem =
                `Você tem o pedido #${pedido.num_pedido} agendado para ` +
                `${dataHoraParaMensagem(pedido.data_ag)} que ainda não foi retirado. ` +
                `Compareça à cantina para retirá-lo e regularizar sua situação. ` +
                `Enquanto houver bloqueio, não será possível fazer novas compras pelo aplicativo.`;

            await conexao.query(`
                INSERT INTO app_pedidos_nao_retirados
                    (id_pedido, id_user, dias_atraso, bloqueado, aviso_app_pendente, mensagem_aviso)
                VALUES (?, ?, ?, 0, 1, ?)
                ON DUPLICATE KEY UPDATE
                    id_user = VALUES(id_user),
                    dias_atraso = VALUES(dias_atraso),
                    regularizado = 0,
                    data_atualizacao = NOW()
            `, [pedido.id_pedido, pedido.id_user, dias, mensagem]);
        }

        const [clientes] = await conexao.query(`
            SELECT
                u.id_user,
                u.nome,
                u.email,
                u.data_criacao,
                COALESCE(MAX(
                    CASE WHEN c.regularizado = 0 AND c.bloqueado = 1 THEN 1 ELSE 0 END
                ), 0) AS bloqueado_app,
                COUNT(DISTINCT CASE
                    WHEN c.regularizado = 0 THEN c.id_pedido
                    ELSE NULL
                END) AS pedidos_nao_retirados
            FROM users u
            LEFT JOIN app_pedidos_nao_retirados c ON c.id_user = u.id_user
            WHERE LOWER(TRIM(u.nome)) <> 'consumidor final'
            GROUP BY u.id_user, u.nome, u.email, u.data_criacao
            ORDER BY u.nome ASC
        `);

        const idsPedidos = pedidosVencidos.map(p => p.id_pedido);
        let controlePorPedido = {};

        if (idsPedidos.length > 0) {
            const placeholders = idsPedidos.map(() => '?').join(',');
            const [controles] = await conexao.query(`
                SELECT id_pedido, bloqueado, aviso_app_pendente
                FROM app_pedidos_nao_retirados
                WHERE id_pedido IN (${placeholders})
                  AND regularizado = 0
            `, idsPedidos);

            controlePorPedido = Object.fromEntries(
                controles.map(c => [String(c.id_pedido), c])
            );
        }

        const pedidos = pedidosVencidos.map(pedido => ({
            ...pedido,
            bloqueado: Number(controlePorPedido[String(pedido.id_pedido)]?.bloqueado || 0),
            aviso_app_pendente: Number(controlePorPedido[String(pedido.id_pedido)]?.aviso_app_pendente || 0)
        }));

        return res.json({
            sucesso: true,
            dias_limite: dias,
            clientes,
            pedidos_nao_retirados: pedidos
        });
    } catch (erro) {
        console.error("Erro ao carregar clientes do APP:", erro);
        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível carregar os clientes do aplicativo."
        });
    }
});

// alterar bloqueio de cliente app //
router.put("/agendamento/clientes-app/:id_user/bloqueio", verificarToken, exigirFuncionarioIntranet, async (req, res) => {
    try {
        await garantirTabelaControleApp(conexao);

        const idUser = Number(req.params.id_user);
        if (!Number.isInteger(idUser) || idUser <= 0) {
            return res.status(400).json({ sucesso: false, erro: "Cliente inválido." });
        }

        const [pendencias] = await conexao.query(`
            SELECT COUNT(*) AS total
            FROM app_pedidos_nao_retirados
            WHERE id_user = ? AND regularizado = 0
        `, [idUser]);

        if (Number(pendencias[0]?.total || 0) === 0) {
            return res.status(409).json({
                sucesso: false,
                erro: "Este cliente não possui pedido pendente de regularização."
            });
        }

        await conexao.query(`
            UPDATE app_pedidos_nao_retirados
            SET bloqueado = 1,
                aviso_app_pendente = 1,
                mensagem_aviso = CONCAT(
                    'Você tem um pedido agendado que ainda não foi retirado. ',
                    'Compareça à cantina para retirá-lo e regularizar sua situação. ',
                    'Enquanto houver pendência, as compras pelo aplicativo ficarão bloqueadas.'
                ),
                data_atualizacao = NOW()
            WHERE id_user = ? AND regularizado = 0
        `, [idUser]);

        return res.json({
            sucesso: true,
            bloqueado: true,
            mensagem: "Compras pelo aplicativo bloqueadas até a regularização dos pedidos não retirados."
        });
    } catch (erro) {
        console.error("Erro ao bloquear cliente do APP:", erro);
        return res.status(500).json({ sucesso: false, erro: "Não foi possível bloquear este cliente." });
    }
});

// consultar bloqueio de compras app //
router.get("/app/bloqueio-compras", verificarToken, async (req, res) => {
    try {
        await garantirTabelaControleApp(conexao);
        const idUser = obterIdUsuarioToken(req);

        if (!idUser) {
            return res.status(401).json({ sucesso: false, erro: "Não foi possível identificar o usuário logado." });
        }

        const bloqueio = await obterBloqueioApp(idUser, conexao);
        return res.json({
            sucesso: true,
            bloqueado: bloqueio.bloqueado,
            mensagem: bloqueio.bloqueado
                ? "Você possui um pedido que ainda não foi retirado. Procure a cantina para regularizar sua situação antes de fazer novas compras pelo aplicativo."
                : null
        });
    } catch (erro) {
        console.error("Erro ao consultar bloqueio do APP:", erro);
        return res.status(500).json({ sucesso: false, erro: "Não foi possível consultar a situação da conta." });
    }
});

// listar avisos pendentes app //
router.get("/app/avisos-pendentes", verificarToken, async (req, res) => {
    try {
        await garantirTabelaControleApp(conexao);
        const idUser = obterIdUsuarioToken(req);

        if (!idUser) {
            return res.status(401).json({ sucesso: false, erro: "Não foi possível identificar o usuário logado." });
        }

        const [avisos] = await conexao.query(`
            SELECT id_pedido, mensagem_aviso, data_identificacao
            FROM app_pedidos_nao_retirados
            WHERE id_user = ?
              AND regularizado = 0
              AND aviso_app_pendente = 1
            ORDER BY data_identificacao ASC
        `, [idUser]);

        return res.json({ sucesso: true, avisos });
    } catch (erro) {
        console.error("Erro ao consultar avisos do APP:", erro);
        return res.status(500).json({ sucesso: false, erro: "Não foi possível carregar os avisos." });
    }
});

// marcar aviso pendente como visualizado //
router.put("/app/avisos-pendentes/:id_pedido/visualizado", verificarToken, async (req, res) => {
    try {
        await garantirTabelaControleApp(conexao);
        const idUser = obterIdUsuarioToken(req);
        const idPedido = Number(req.params.id_pedido);

        if (!idUser || !Number.isInteger(idPedido) || idPedido <= 0) {
            return res.status(400).json({ sucesso: false, erro: "Dados inválidos." });
        }

        await conexao.query(`
            UPDATE app_pedidos_nao_retirados
            SET aviso_app_pendente = 0,
                data_aviso_visualizado = NOW(),
                data_atualizacao = NOW()
            WHERE id_pedido = ? AND id_user = ? AND regularizado = 0
        `, [idPedido, idUser]);

        return res.json({ sucesso: true });
    } catch (erro) {
        console.error("Erro ao marcar aviso como visualizado:", erro);
        return res.status(500).json({ sucesso: false, erro: "Não foi possível atualizar o aviso." });
    }
});

module.exports = router;

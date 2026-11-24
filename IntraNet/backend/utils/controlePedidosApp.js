const conexao = require('../db');

async function garantirTabelaControleApp(executor = conexao) {
    await executor.query(`
        CREATE TABLE IF NOT EXISTS app_pedidos_nao_retirados (
            id_pedido INT NOT NULL,
            id_user INT NOT NULL,
            dias_atraso INT NOT NULL DEFAULT 2,
            bloqueado TINYINT(1) NOT NULL DEFAULT 0,
            aviso_app_pendente TINYINT(1) NOT NULL DEFAULT 1,
            mensagem_aviso VARCHAR(500) NOT NULL,
            regularizado TINYINT(1) NOT NULL DEFAULT 0,
            data_identificacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            data_aviso_visualizado DATETIME DEFAULT NULL,
            PRIMARY KEY (id_pedido),
            KEY idx_app_pendencias_user (id_user, regularizado, bloqueado)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

function obterIdUsuarioToken(req) {
    const identidade = req?.user || req?.usuario || {};
    const id = Number(
        identidade.id_user ??
        identidade.id_usuario ??
        identidade.id ??
        req?.userId ??
        req?.usuarioId
    );

    return Number.isInteger(id) && id > 0 ? id : null;
}

async function obterBloqueioApp(idUser, executor = conexao) {
    const id = Number(idUser);

    if (!Number.isInteger(id) || id <= 0) {
        return { bloqueado: false, pedidos: [] };
    }

    const [rows] = await executor.query(`
        SELECT id_pedido, mensagem_aviso
        FROM app_pedidos_nao_retirados
        WHERE id_user = ?
          AND bloqueado = 1
          AND regularizado = 0
        ORDER BY data_identificacao ASC
    `, [id]);

    return {
        bloqueado: rows.length > 0,
        pedidos: rows
    };
}

async function regularizarPedidoApp(idPedido, executor = conexao) {
    await executor.query(`
        UPDATE app_pedidos_nao_retirados
        SET regularizado = 1,
            bloqueado = 0,
            aviso_app_pendente = 0,
            data_atualizacao = NOW()
        WHERE id_pedido = ?
    `, [idPedido]);
}

module.exports = {
    garantirTabelaControleApp,
    obterIdUsuarioToken,
    obterBloqueioApp,
    regularizarPedidoApp
};

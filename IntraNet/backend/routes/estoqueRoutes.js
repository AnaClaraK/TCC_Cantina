const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');
const {
    aplicarDisponibilidadeReceitas,
    obterGrupoLiquido,
    configurarGrupoLiquido,
    obterVolumeVendaMl
} = require('../utils/estoqueLiquidos');

// Lista os produtos usando a tabela existente. Só os itens configurados
// no JSON de grupos interpretam qtd/qtd_min como mililitros.
router.get('/produtos', verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT p.*, c.nome AS categoria_nome,
                COALESCE(SUM(CASE WHEN pe.status = 'Agendado' THEN pi.qtd ELSE 0 END), 0) AS reservado,
                (p.qtd - COALESCE(SUM(CASE WHEN pe.status = 'Agendado' THEN pi.qtd ELSE 0 END), 0)) AS disponivel
            FROM produtos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN pedidos_itens pi ON pi.id_produto = p.id_produto
            LEFT JOIN pedidos pe ON pe.id_pedido = pi.id_pedido
            GROUP BY p.id_produto
        `);
        await aplicarDisponibilidadeReceitas(rows, conexao, { mostrarVolume: true });
        res.json(rows);
    } catch (erro) {
        console.error('Erro ao buscar produtos do estoque:', erro);
        res.status(500).json({ erro: 'Erro ao buscar produtos do estoque.' });
    }
});

// Reposição normal continua em unidades. Para produto de grupo líquido,
// a quantidade adicionada é ml e atualiza todos os membros do grupo.
router.put('/produtos/cod/:codigo/add', verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        const codigo = String(req.params.codigo || '');
        const quantidade = Number(req.body?.quantidade);
        if (!Number.isFinite(quantidade) || quantidade <= 0) {
            return res.status(400).json({ erro: 'Quantidade inválida.' });
        }
        const [rows] = await conn.query(
            'SELECT id_produto FROM produtos WHERE codigo_barras = ? LIMIT 1', [codigo]
        );
        if (!rows.length) return res.status(404).json({ erro: 'Produto não encontrado.' });
        const idProduto = Number(rows[0].id_produto);
        const grupo = await obterGrupoLiquido(idProduto);
        await conn.beginTransaction();
        if (grupo) {
            const ids = [...new Set(grupo.ids.map(Number))];
            await conn.query('UPDATE produtos SET qtd = COALESCE(qtd, 0) + ? WHERE id_produto IN (?)', [quantidade, ids]);
        } else {
            await conn.query('UPDATE produtos SET qtd = COALESCE(qtd, 0) + ? WHERE id_produto = ?', [quantidade, idProduto]);
        }
        await conn.commit();
        res.json({ mensagem: grupo ? 'Estoque líquido atualizado em ml.' : 'Estoque atualizado.' });
    } catch (erro) {
        try { await conn.rollback(); } catch (_) {}
        console.error('Erro ao adicionar estoque:', erro);
        res.status(500).json({ erro: 'Erro ao atualizar estoque.' });
    } finally {
        conn.release();
    }
});

// Salva o grupo de produtos no arquivo JSON e o saldo nas colunas já existentes.
// Nenhuma coluna/tabela é criada. A quantidade inicial é informada pela reposição.
router.put('/estoque-liquidos/produtos', verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    let ids = [];
    try {
        ids = [...new Set((Array.isArray(req.body?.ids_produtos) ? req.body.ids_produtos : [])
            .map(Number).filter(id => Number.isInteger(id) && id > 0))];
        const quantidade = Number(req.body?.quantidade);
        if (!ids.length) return res.status(400).json({ erro: 'Selecione pelo menos um produto para compartilhar o estoque.' });
        if (req.body?.quantidade === '' || !Number.isFinite(quantidade) || quantidade < 0) {
            return res.status(400).json({ erro: 'Informe uma quantidade em ml válida, igual ou maior que zero.' });
        }
        await conn.beginTransaction();
        const [produtos] = await conn.query(
            'SELECT id_produto, nome, qtd, qtd_min FROM produtos WHERE id_produto IN (?) FOR UPDATE', [ids]
        );
        if (produtos.length !== ids.length) throw new Error('Um ou mais produtos selecionados não foram encontrados.');
        const semVolume = produtos.filter(p => !obterVolumeVendaMl(p.nome));
        if (semVolume.length) {
            throw new Error(`Informe o volume em ml no nome de cada produto selecionado. Produto(s): ${semVolume.map(p => p.nome).join(', ')}.`);
        }

        // Configuração gravada fora do banco; as colunas qtd/qtd_min existentes
        // recebem o mesmo saldo para que as rotas legadas continuem compatíveis.
        const novoGrupo = await configurarGrupoLiquido(ids);
        await conn.query('UPDATE produtos SET qtd = ?, qtd_min = 100 WHERE id_produto IN (?)', [quantidade, ids]);
        await conn.commit();
        res.json({ mensagem: 'Estoque compartilhado em ml atualizado.', ids_produtos: ids, quantidade_ml: quantidade, quantidade_minima_ml: 100, grupo: novoGrupo.id });
    } catch (erro) {
        try { await conn.rollback(); } catch (_) {}
        console.error('Erro ao configurar estoque compartilhado em ml:', erro);
        res.status(400).json({ erro: erro.message || 'Não foi possível atualizar o estoque em ml.' });
    } finally {
        conn.release();
    }
});

// Compatibilidade com a versão anterior da tela, que enviava um único ID.
router.put('/estoque-liquidos/produtos/:id', verificarToken, async (req, res) => {
    req.body = { ...(req.body || {}), ids_produtos: [Number(req.params.id)] };
    // Reaproveita a mesma lógica da rota principal.
    const quantidade = Number(req.body.quantidade);
    if (req.body.quantidade === '' || !Number.isFinite(quantidade) || quantidade < 0) {
        return res.status(400).json({ erro: 'Informe uma quantidade em ml válida.' });
    }
    const conn = await conexao.getConnection();
    try {
        const id = Number(req.params.id);
        const [rows] = await conn.query('SELECT id_produto, nome FROM produtos WHERE id_produto = ?', [id]);
        if (!rows.length) return res.status(404).json({ erro: 'Produto não encontrado.' });
        if (!require('../utils/estoqueLiquidos').obterVolumeVendaMl(rows[0].nome)) {
            return res.status(400).json({ erro: 'O nome do produto precisa indicar o volume em ml, como 50 ml.' });
        }
        const { configurarGrupoLiquido } = require('../utils/estoqueLiquidos');
        await conn.beginTransaction();
        await configurarGrupoLiquido([id]);
        await conn.query('UPDATE produtos SET qtd = ?, qtd_min = 100 WHERE id_produto = ?', [quantidade, id]);
        await conn.commit();
        res.json({ mensagem: 'Estoque do produto atualizado em ml.' });
    } catch (erro) {
        try { await conn.rollback(); } catch (_) {}
        console.error('Erro ao configurar estoque líquido:', erro);
        res.status(400).json({ erro: erro.message || 'Não foi possível atualizar o estoque em ml.' });
    } finally {
        conn.release();
    }
});

module.exports = router;

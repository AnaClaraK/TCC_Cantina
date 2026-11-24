const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');
const {
    obterGrupoLiquido,
    configurarGrupoLiquido,
    obterVolumeVendaMl
} = require('../utils/estoqueLiquidos');

// adicionar estoque por codigo de barras //
router.put('/produtos/cod/:codigo/add', verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        const codigo = String(req.params.codigo || '');
        const quantidade = Number(req.body?.quantidade);
        if (!Number.isFinite(quantidade) || quantidade <= 0) {
            return res.status(400).json({ erro: 'Quantidade inválida.' });
        }

        const [rows] = await conn.query(
            'SELECT id_produto FROM produtos WHERE codigo_barras = ? LIMIT 1',
            [codigo]
        );
        if (!rows.length) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

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
        return res.json({ mensagem: grupo ? 'Estoque líquido atualizado em ml.' : 'Estoque atualizado.' });
    } catch (erro) {
        try { await conn.rollback(); } catch (_) {}
        console.error('Erro ao adicionar estoque:', erro);
        return res.status(500).json({ erro: 'Erro ao atualizar estoque.' });
    } finally {
        conn.release();
    }
});

// atualizar estoque de liquidos //
router.put('/estoque-liquidos/produtos', verificarToken, async (req, res) => {
    const conn = await conexao.getConnection();
    try {
        const ids = [...new Set((Array.isArray(req.body?.ids_produtos) ? req.body.ids_produtos : [])
            .map(Number).filter(id => Number.isInteger(id) && id > 0))];
        const quantidade = Number(req.body?.quantidade);

        if (!ids.length) {
            return res.status(400).json({ erro: 'Selecione pelo menos um produto para compartilhar o estoque.' });
        }
        if (req.body?.quantidade === '' || !Number.isFinite(quantidade) || quantidade < 0) {
            return res.status(400).json({ erro: 'Informe uma quantidade em ml válida, igual ou maior que zero.' });
        }

        await conn.beginTransaction();
        const [produtos] = await conn.query(
            'SELECT id_produto, nome, qtd, qtd_min FROM produtos WHERE id_produto IN (?) FOR UPDATE',
            [ids]
        );
        if (produtos.length !== ids.length) {
            throw new Error('Um ou mais produtos selecionados não foram encontrados.');
        }

        const semVolume = produtos.filter(p => !obterVolumeVendaMl(p.nome));
        if (semVolume.length) {
            throw new Error(`Informe o volume em ml no nome de cada produto selecionado. Produto(s): ${semVolume.map(p => p.nome).join(', ')}.`);
        }

        const novoGrupo = await configurarGrupoLiquido(ids);
        await conn.query('UPDATE produtos SET qtd = ?, qtd_min = 100 WHERE id_produto IN (?)', [quantidade, ids]);
        await conn.commit();

        return res.json({
            mensagem: 'Estoque compartilhado em ml atualizado.',
            ids_produtos: ids,
            quantidade_ml: quantidade,
            quantidade_minima_ml: 100,
            grupo: novoGrupo.id
        });
    } catch (erro) {
        try { await conn.rollback(); } catch (_) {}
        console.error('Erro ao configurar estoque compartilhado em ml:', erro);
        return res.status(400).json({ erro: erro.message || 'Não foi possível atualizar o estoque em ml.' });
    } finally {
        conn.release();
    }
});

// atualizar estoque de liquido por id //
router.put('/estoque-liquidos/produtos/:id', verificarToken, async (req, res) => {
    req.body = { ...(req.body || {}), ids_produtos: [Number(req.params.id)] };
    const quantidade = Number(req.body.quantidade);

    if (req.body.quantidade === '' || !Number.isFinite(quantidade) || quantidade < 0) {
        return res.status(400).json({ erro: 'Informe uma quantidade em ml válida.' });
    }

    const conn = await conexao.getConnection();
    try {
        const id = Number(req.params.id);
        const [rows] = await conn.query('SELECT id_produto, nome FROM produtos WHERE id_produto = ?', [id]);
        if (!rows.length) {
            return res.status(404).json({ erro: 'Produto não encontrado.' });
        }

        if (!obterVolumeVendaMl(rows[0].nome)) {
            return res.status(400).json({ erro: 'O nome do produto precisa indicar o volume em ml, como 50 ml.' });
        }

        await conn.beginTransaction();
        await configurarGrupoLiquido([id]);
        await conn.query('UPDATE produtos SET qtd = ?, qtd_min = 100 WHERE id_produto = ?', [quantidade, id]);
        await conn.commit();

        return res.json({ mensagem: 'Estoque do produto atualizado em ml.' });
    } catch (erro) {
        try { await conn.rollback(); } catch (_) {}
        console.error('Erro ao configurar estoque líquido:', erro);
        return res.status(400).json({ erro: erro.message || 'Não foi possível atualizar o estoque em ml.' });
    } finally {
        conn.release();
    }
});

module.exports = router;

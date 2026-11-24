const express = require('express');
const router = express.Router();
const conexao = require('../db');
const verificarToken = require('../middlewares/auth');
const { uploadProdutos } = require('../config/multer');
const {
    aplicarDisponibilidadeReceitas,
    obterGrupoLiquido
} = require('../utils/estoqueLiquidos');

// proximo codigo de barras //
router.get("/produtos/proximo-codigo", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT codigo_barras
            FROM produtos
            ORDER BY id_produto DESC
            LIMIT 1
        `);

        let proximoCodigo = 1;
        if (rows.length > 0 && rows[0].codigo_barras) {
            const ultimoCodigo = parseInt(rows[0].codigo_barras, 10);
            if (!isNaN(ultimoCodigo)) {
                proximoCodigo = ultimoCodigo + 1;
            }
        }

        return res.json({ proximoCodigo });
    } catch (erro) {
        console.error("Erro ao buscar próximo código:", erro);
        return res.status(500).json({ erro: "Erro ao buscar próximo código" });
    }
});

// cadastrar produto //
router.post("/produtos", verificarToken, uploadProdutos.single("imagem"), async (req, res) => {
    try {
        const {
            nome,
            preco,
            codigo,
            quantidade,
            qtd_min,
            descricao,
            id_categoria,
            valor_bruto,
            porcentagem_lucro
        } = req.body;

        if (!nome || !preco || !codigo || !id_categoria || !valor_bruto) {
            return res.status(400).json({ erro: "Preencha todos os campos obrigatórios" });
        }

        const precoFormatado = String(preco).replace(",", ".");
        const valorBrutoFormatado = String(valor_bruto).replace(",", ".");
        const porcentagemFormatada = porcentagem_lucro ? String(porcentagem_lucro).replace(",", ".") : 0;
        const imagem = req.file ? req.file.filename : null;

        const [resultado] = await conexao.query(
            `INSERT INTO produtos (
                nome, preco, codigo_barras, qtd, qtd_min, descricao, id_categoria, valor_bruto, porcentagem_lucro, img, ativo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                nome,
                precoFormatado,
                codigo,
                quantidade || 0,
                qtd_min || 0,
                descricao,
                id_categoria,
                valorBrutoFormatado,
                porcentagemFormatada,
                imagem
            ]
        );

        return res.status(201).json({
            mensagem: "Produto cadastrado com sucesso!",
            id_produto: resultado.insertId
        });
    } catch (erro) {
        console.error("Erro ao cadastrar produto:", erro);
        return res.status(500).json({ erro: "Erro interno ao cadastrar produto" });
    }
});

// listar categorias //
router.get("/categorias", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT id_categoria, nome
            FROM categorias
            ORDER BY nome
        `);
        return res.json(rows);
    } catch (erro) {
        console.error("Erro ao listar categorias:", erro);
        return res.status(500).json({ erro: "Erro ao listar categorias" });
    }
});

// cadastrar categoria //
router.post("/categorias", verificarToken, async (req, res) => {
    try {
        const nome = String(req.body?.nome || "").trim();

        if (!nome) {
            return res.status(400).json({ erro: "Informe o nome da categoria." });
        }

        if (nome.length > 100) {
            return res.status(400).json({ erro: "O nome da categoria deve ter no máximo 100 caracteres." });
        }

        const [existente] = await conexao.query(
            "SELECT id_categoria, nome FROM categorias WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) LIMIT 1",
            [nome]
        );

        if (existente.length > 0) {
            return res.status(409).json({
                erro: "Já existe uma categoria cadastrada com este nome.",
                categoria: existente[0]
            });
        }

        const [resultado] = await conexao.query(
            "INSERT INTO categorias (nome) VALUES (?)",
            [nome]
        );

        return res.status(201).json({
            mensagem: "Categoria cadastrada com sucesso!",
            id_categoria: resultado.insertId,
            nome
        });
    } catch (erro) {
        console.error("Erro ao cadastrar categoria:", erro);
        return res.status(500).json({ erro: "Erro interno ao cadastrar categoria." });
    }
});

// buscar produtos //
router.get("/produtos/busca", verificarToken, async (req, res) => {
    try {
        const termo = String(req.query.q || "").trim();
        if (!termo) {
            return res.json([]);
        }

        const [produtos] = await conexao.query(
            `SELECT id_produto, nome, codigo_barras, preco, qtd, qtd_min, img, ativo
            FROM produtos
            WHERE (nome LIKE ? OR codigo_barras LIKE ?) AND ativo = 1
            LIMIT 20`,
            [`%${termo}%`, `%${termo}%`]
        );

        await aplicarDisponibilidadeReceitas(produtos, conexao);
        return res.json(produtos);
    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);
        return res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
});

// buscar produto por codigo //
router.get("/produtos/cod/:codigo", verificarToken, async (req, res) => {
    try {
        const codigo = req.params.codigo;

        const [rows] = await conexao.query(
            `SELECT * FROM produtos
            WHERE (TRIM(codigo_barras) = TRIM(?) OR id_produto = ?) AND ativo = 1
            ORDER BY (TRIM(codigo_barras) = TRIM(?)) DESC
            LIMIT 1`,
            [codigo, isNaN(Number(codigo)) ? -1 : Number(codigo), codigo]
        );

        if (rows.length === 0) {
            return res.status(404).json({ erro: "Produto não encontrado ou inativo" });
        }

        await aplicarDisponibilidadeReceitas(rows, conexao);
        return res.json(rows[0]);
    } catch (erro) {
        console.error("Erro ao buscar produto por código:", erro);
        return res.status(500).json({ erro: "Erro ao buscar produto por código" });
    }
});

// buscar produto por id //
router.get("/produtos/id/:id", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await conexao.query(
            "SELECT * FROM produtos WHERE id_produto = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ erro: "Produto não encontrado" });
        }

        await aplicarDisponibilidadeReceitas(rows, conexao);
        return res.json(rows[0]);
    } catch (erro) {
        console.error("Erro ao buscar produto por ID:", erro);
        return res.status(500).json({ erro: "Erro ao buscar produto por ID" });
    }
});

// atualizar produto por codigo //
router.put("/produtos/cod/:id", verificarToken, uploadProdutos.single("img"), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nome,
            codigo_barras,
            preco,
            qtd,
            qtd_min,
            descricao,
            valor_bruto,
            porcentagem_lucro,
            ativo
        } = req.body;

        const [produto] = await conexao.query(
            "SELECT id_produto FROM produtos WHERE id_produto = ?",
            [id]
        );

        if (produto.length === 0) {
            return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
        }

        let ativoFinal = 1;
        if (ativo !== undefined && ativo !== "") {
            ativoFinal = Number(ativo);
            if (ativoFinal !== 0 && ativoFinal !== 1) {
                return res.status(400).json({ sucesso: false, erro: "Status do produto inválido." });
            }
        }

        const img = req.file ? req.file.filename : null;
        const grupoLiquido = await obterGrupoLiquido(Number(id));

        if (grupoLiquido) {
            const conn = await conexao.getConnection();
            try {
                await conn.beginTransaction();

                await conn.query(
                    `UPDATE produtos
                    SET nome = ?, codigo_barras = ?, preco = ?, qtd = ?, qtd_min = ?,
                        descricao = ?, valor_bruto = ?, porcentagem_lucro = ?, ativo = ?
                        ${img ? ", img = ?" : ""}
                    WHERE id_produto = ?`,
                    img
                        ? [nome, codigo_barras, preco, qtd, qtd_min, descricao, valor_bruto, porcentagem_lucro, ativoFinal, img, id]
                        : [nome, codigo_barras, preco, qtd, qtd_min, descricao, valor_bruto, porcentagem_lucro, ativoFinal, id]
                );

                const idsIrmaos = grupoLiquido.ids.map(Number).filter(idItem => idItem !== Number(id));
                if (idsIrmaos.length > 0) {
                    await conn.query(
                        "UPDATE produtos SET qtd = ?, qtd_min = ? WHERE id_produto IN (?)",
                        [qtd, qtd_min, idsIrmaos]
                    );
                }

                await conn.commit();
                return res.json({ sucesso: true, mensagem: "Produto e estoque compartilhado atualizados com sucesso!" });
            } catch (erroTransacao) {
                await conn.rollback();
                throw erroTransacao;
            } finally {
                conn.release();
            }
        }

        await conexao.query(
            `UPDATE produtos
            SET nome = ?, codigo_barras = ?, preco = ?, qtd = ?, qtd_min = ?,
                descricao = ?, valor_bruto = ?, porcentagem_lucro = ?, ativo = ?
                ${img ? ", img = ?" : ""}
            WHERE id_produto = ?`,
            img
                ? [nome, codigo_barras, preco, qtd, qtd_min, descricao, valor_bruto, porcentagem_lucro, ativoFinal, img, id]
                : [nome, codigo_barras, preco, qtd, qtd_min, descricao, valor_bruto, porcentagem_lucro, ativoFinal, id]
        );

        return res.json({ sucesso: true, mensagem: "Produto atualizado com sucesso!" });
    } catch (erro) {
        console.error("Erro ao atualizar produto:", erro);
        return res.status(500).json({ sucesso: false, erro: "Erro ao atualizar produto." });
    }
});

// alterar status do produto //
router.put("/produtos/id/:id/status", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body;
        const novoStatus = Number(ativo);

        if (novoStatus !== 0 && novoStatus !== 1) {
            return res.status(400).json({ sucesso: false, erro: "Status do produto inválido." });
        }

        const [produto] = await conexao.query(
            "SELECT id_produto, nome, ativo FROM produtos WHERE id_produto = ?",
            [id]
        );

        if (produto.length === 0) {
            return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
        }

        await conexao.query(
            "UPDATE produtos SET ativo = ? WHERE id_produto = ?",
            [novoStatus, id]
        );

        return res.json({
            sucesso: true,
            id_produto: Number(id),
            ativo: novoStatus,
            mensagem: `Produto "${produto[0].nome}" foi ${novoStatus === 1 ? "ativado" : "desativado"} com sucesso.`
        });
    } catch (erro) {
        console.error("Erro ao alterar status do produto:", erro);
        return res.status(500).json({ sucesso: false, erro: "Erro ao atualizar status do produto." });
    }
});

// listar produtos //
router.get("/produtos", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT p.*, c.nome AS categoria_nome
            FROM produtos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            ORDER BY p.ativo DESC, p.nome ASC
        `);

        await aplicarDisponibilidadeReceitas(rows, conexao, {
            mostrarVolume: req.query.modo === "estoque"
        });

        return res.json(rows);
    } catch (erro) {
        console.error("Erro ao listar produtos:", erro);
        return res.status(500).json({ erro: "Erro ao listar produtos" });
    }
});

module.exports = router;

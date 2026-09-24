const express =
require('express');

const router =
express.Router();

const conexao =
require('../db');

const verificarToken =
require('../middlewares/auth');

const {

    uploadProdutos

}
=
require('../config/multer');
const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";

//--------- Cadastro produtos add
// =====================================================
// ROTA: Buscar Próximo Código de Barras
// =====================================================
router.get("/produtos/proximo-codigo", verificarToken, async (req, res) => {
    try {
        // Busca o código de barras do produto com o MAIOR id_produto
        const [rows] = await conexao.query(`
            SELECT codigo_barras 
            FROM produtos 
            ORDER BY id_produto DESC 
            LIMIT 1
        `);

        let proximoCodigo = 1;

        if (rows.length > 0 && rows[0].codigo_barras) {
            // Tenta converter para número
            const ultimoCodigo = parseInt(rows[0].codigo_barras, 10);
            if (!isNaN(ultimoCodigo)) {
                proximoCodigo = ultimoCodigo + 1;
            }
        }

        res.json({ proximoCodigo });
    } catch (erro) {
        console.error("Erro ao buscar próximo código:", erro);
        res.status(500).json({ erro: "Erro ao buscar próximo código" });
    }
});

// =====================================================
// ROTA: Cadastrar Produto
// =====================================================
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
            porcentagem_lucro // Recebe a porcentagem enviada pelo frontend
        } = req.body;

        if (!nome || !preco || !codigo || !id_categoria || !valor_bruto) {
            return res.status(400).json({
                erro: "Preencha todos os campos obrigatórios"
            });
        }

        const precoFormatado = String(preco).replace(",", ".");
        const valorBrutoFormatado = String(valor_bruto).replace(",", ".");
        const porcentagemFormatada = porcentagem_lucro ? String(porcentagem_lucro).replace(",", ".") : 0;
        const imagem = req.file ? req.file.filename : 'img_ntf.png';

        // INSERT incluindo 'ativo = 1' e a 'porcentagem_lucro'
        await conexao.query(`
            INSERT INTO produtos
            (
                nome,
                preco,
                codigo_barras,
                qtd,
                qtd_min,
                descricao,
                img,
                id_categoria,
                valor_bruto,
                porcentagem_lucro,
                ativo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
            nome,
            precoFormatado,
            codigo,
            quantidade || 0,
            qtd_min || 0,
            descricao || "",
            imagem,
            id_categoria,
            valorBrutoFormatado,
            porcentagemFormatada
        ]);

        res.status(201).json({
            mensagem: "Produto cadastrado com sucesso"
        });

    } catch (erro) {
        console.error("Erro ao cadastrar produto:", erro);
        res.status(500).json({
            erro: "Erro ao cadastrar produto"
        });
    }
});
  // LISTAR CATEGORIAS
router.get("/categorias", verificarToken, async (req, res) => {
    try {
  
      const [rows] = await conexao.query(`
        SELECT id_categoria, nome
        FROM categorias
        ORDER BY nome
      `);
  
      res.json(rows);
  
    } catch (erro) {
  
      console.error("Erro ao buscar categorias:", erro);
  
      res.status(500).json({
        erro: "Erro ao buscar categorias"
      });
    }
  });
  router.post(
    "/categorias",
    verificarToken,
    async (req, res) => {

        try {

            const nome =
                String(
                    req.body?.nome || ""
                ).trim();

            if (!nome) {
                return res.status(400).json({
                    erro:
                        "Informe o nome da categoria."
                });
            }

            if (nome.length > 100) {
                return res.status(400).json({
                    erro:
                        "O nome da categoria deve ter no máximo 100 caracteres."
                });
            }

            const [existente] =
                await conexao.query(
                    `
                    SELECT
                        id_categoria,
                        nome
                    FROM categorias
                    WHERE LOWER(TRIM(nome)) =
                          LOWER(TRIM(?))
                    LIMIT 1
                    `,
                    [nome]
                );

            if (existente.length > 0) {
                return res.status(409).json({
                    erro:
                        "Já existe uma categoria com esse nome."
                });
            }

            const [resultado] =
                await conexao.query(
                    `
                    INSERT INTO categorias
                    (
                        nome
                    )
                    VALUES (?)
                    `,
                    [nome]
                );

            return res.status(201).json({
                sucesso: true,
                id_categoria:
                    resultado.insertId,
                nome
            });

        } catch (erro) {

            console.error(
                "Erro ao cadastrar categoria:",
                erro
            );

            return res.status(500).json({
                erro:
                    "Erro ao cadastrar categoria."
            });
        }
    }
);
//-----Busca
router.get("/produtos/busca", verificarToken, async (req, res) => {
    try {
        const termo = String(req.query.q || "").trim();

        if (!termo) {
            return res.json([]);
        }

        const [produtos] = await conexao.query(`
            SELECT
                id_produto,
                nome,
                codigo_barras,
                preco,
                qtd,
                qtd_min,
                img,
                ativo
            FROM produtos
            WHERE ativo = 1
              AND (
                    LOWER(nome) LIKE LOWER(?)
                    OR codigo_barras LIKE ?
                  )
            ORDER BY nome
            LIMIT 10
        `, [
            `%${termo}%`,
            `%${termo}%`
        ]);

        return res.json(produtos);

    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);

        return res.status(500).json({
            sucesso: false,
            erro: "Erro ao buscar produtos."
        });
    }
});

//--- Buscar por Código de Barras específico 
router.get("/produtos/cod/:codigo", verificarToken, async (req, res) => {
    try {
        const codigo = req.params.codigo;

        const [rows] = await conexao.query(
            "SELECT * FROM produtos WHERE codigo_barras = ? AND ativo = 1",
            [codigo]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado ou está inativo"
            });
        }

        res.json(rows);

    } catch (erro) {
        console.error("Erro ao buscar produto:", erro);

        res.status(500).json({
            erro: "Erro ao buscar produto"
        });
    }
});
  //--------Atualizar Produtos
  // BUSCAR 1 PRODUTO PARA EDITAR (Protegido)
router.get("/produtos/id/:id", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await conexao.query(
            "SELECT * FROM produtos WHERE id_produto = ?",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        res.json(rows[0]);

    } catch (erro) {
        console.error("Erro ao buscar produto para edição:", erro);

        res.status(500).json({
            erro: "Erro ao buscar produto"
        });
    }
});
  
  // Editar PRODUTO
router.put(
    "/produtos/cod/:id",
    verificarToken,
    uploadProdutos.single("img"),
    async (req, res) => {

        try {

            console.log("BODY:", req.body);
            console.log("CONTENT-TYPE:", req.headers["content-type"]);

            const { id } = req.params;

            const {
                nome,
                codigo_barras,
                preco,
                qtd,
                qtd_min,
                descricao,
                valor_bruto,
                ativo
            } = req.body;

            // Verifica se o produto existe
            const [produto] = await conexao.query(
                "SELECT id_produto FROM produtos WHERE id_produto = ?",
                [id]
            );

            if (produto.length === 0) {
                return res.status(404).json({
                    sucesso: false,
                    erro: "Produto não encontrado."
                });
            }

            // Validação do status
            let ativoFinal = 1;

            if (ativo !== undefined && ativo !== "") {

                ativoFinal = Number(ativo);

                if (ativoFinal !== 0 && ativoFinal !== 1) {
                    return res.status(400).json({
                        sucesso: false,
                        erro: "Status do produto inválido."
                    });
                }
            }

            // Verifica se foi enviada uma nova imagem
            const img = req.file ? req.file.filename : null;

            // Atualiza o produto
            await conexao.query(
                `
                UPDATE produtos SET
                    nome = ?,
                    codigo_barras = ?,
                    preco = ?,
                    qtd = ?,
                    qtd_min = ?,
                    descricao = ?,
                    valor_bruto = ?,
                    ativo = ?,
                    img = COALESCE(?, img)
                WHERE id_produto = ?
                `,
                [
                    nome,
                    codigo_barras,
                    preco,
                    qtd,
                    qtd_min || 0,
                    descricao,
                    valor_bruto,
                    ativoFinal,
                    img,
                    id
                ]
            );

            return res.json({
                sucesso: true,
                mensagem: "Produto atualizado com sucesso."
            });

        } catch (error) {

            console.error("Erro ao atualizar produto:", error);

            return res.status(500).json({
                sucesso: false,
                erro: "Erro ao atualizar produto."
            });
        }
    }
);


// =====================================================
// ALTERAR STATUS DO PRODUTO
// =====================================================
router.put(
    "/produtos/id/:id/status",
    verificarToken,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { ativo } = req.body;

            const novoStatus = Number(ativo);

            // Só aceita 0 ou 1
            if (novoStatus !== 0 && novoStatus !== 1) {
                return res.status(400).json({
                    sucesso: false,
                    erro: "Status do produto inválido."
                });
            }

            // Verifica se existe
            const [produto] = await conexao.query(
                "SELECT id_produto, nome, ativo FROM produtos WHERE id_produto = ?",
                [id]
            );

            if (produto.length === 0) {
                return res.status(404).json({
                    sucesso: false,
                    erro: "Produto não encontrado."
                });
            }

            await conexao.query(
                `
                UPDATE produtos
                SET ativo = ?
                WHERE id_produto = ?
                `,
                [novoStatus, id]
            );

            return res.json({
                sucesso: true,
                mensagem:
                    novoStatus === 1
                        ? "Produto reativado com sucesso."
                        : "Produto inativado com sucesso."
            });

        } catch (erro) {
            console.error("Erro ao alterar status do produto:", erro);

            return res.status(500).json({
                sucesso: false,
                erro: "Erro ao alterar status do produto."
            });
        }
    }
);

// LISTAGEM DE PRODUTOS (Trarando produtos inativos no final)
router.get("/produtos", verificarToken, async (req, res) => {
    try {
        const [rows] = await conexao.query(`
            SELECT p.*, c.nome AS categoria_nome 
            FROM produtos p
            LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
            ORDER BY p.ativo DESC, p.nome ASC
        `);
        res.json(rows);
    } catch (erro) {
        console.error("Erro ao listar produtos:", erro);
        res.status(500).json({ erro: "Erro ao listar produtos" });
    }
});
    module.exports = router;
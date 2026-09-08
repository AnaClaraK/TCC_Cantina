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
//--------- Cadastro produtos add
router.post("/produtos", verificarToken, uploadProdutos.single("imagem"), async (req, res) => {
    try {
        const {
          nome,
          preco,
          codigo,
          quantidade,
          descricao,
          id_categoria
        } = req.body;

        if (!nome || !preco || !codigo || !id_categoria) {
          return res.status(400).json({
            erro: "Preencha todos os campos obrigatórios"
          });
        }

        const precoFormatado = String(preco).replace(",", ".");

        // Se req.file não existir (usuário não enviou foto), usa 'img_ntf.png'
        const imagem = req.file ? req.file.filename : 'img_ntf.png';

        await conexao.query(`
          INSERT INTO produtos
          (
            nome,
            preco,
            codigo_barras,
            qtd,
            descricao,
            img,
            id_categoria
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          nome,
          precoFormatado,
          codigo,
          quantidade || 0,
          descricao || "",
          imagem,
          id_categoria
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
// Rota para buscar o próximo código de barras disponível
router.get("/produtos/proximo-codigo", verificarToken, async (req, res) => {
    try {
        // Converte o campo codigo_barras para número e pega o maior valor
        const [rows] = await conexao.query(`
            SELECT MAX(CAST(codigo_barras AS UNSIGNED)) AS maior_codigo 
            FROM produtos 
            WHERE codigo_barras REGEXP '^[0-9]+$'
        `);

        const proximoCodigo = (rows[0].maior_codigo || 0) + 1;

        res.json({ proximoCodigo });
    } catch (erro) {
        console.error("Erro ao buscar próximo código:", erro);
        res.status(500).json({ erro: "Erro ao buscar próximo código" });
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
  router.put("/produtos/cod/:id", verificarToken, uploadProdutos.single("img"), async (req, res) => {
      try {
        console.log("BODY:", req.body);
console.log(req.headers["content-type"]);
        const { id } = req.params;
        // Adicionamos 'qtd_min' aqui na desestruturação do corpo
        const { nome, codigo_barras, preco, qtd, qtd_min, descricao } = req.body; 
        const img = req.file ? req.file.filename : null;
    
        await conexao.query(`
          UPDATE produtos SET
            nome = ?, 
            codigo_barras = ?, 
            preco = ?, 
            qtd = ?, 
            qtd_min = ?, 
            descricao = ?, 
            img = COALESCE(?, img)
          WHERE id_produto = ?
        `, [nome, codigo_barras, preco, qtd, qtd_min || 0, descricao, img, id]);
    
        res.json({ msg: "ok" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao atualizar produto" });
      }
    });

    // ROTA PARA ALTERNAR STATUS (ATIVO / INATIVO)
router.put("/produtos/cod/:id/status", verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body; // true ou false (1 ou 0)

        await conexao.query(`
            UPDATE produtos SET ativo = ? WHERE id_produto = ?
        `, [ativo ? 1 : 0, id]);

        res.json({ mensagem: "Status do produto atualizado com sucesso" });
    } catch (erro) {
        console.error("Erro ao alterar status do produto:", erro);
        res.status(500).json({ erro: "Erro ao alterar status do produto" });
    }
});

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
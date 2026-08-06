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
  
        const imagem = req.file
          ? req.file.filename
          : null;
  
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
      const q = req.query.q?.trim();
  
      if (!q) {
        return res.json([]);
      }
  
      const termo = `%${q}%`;
  
      const [rows] = await conexao.query(`
        SELECT id_produto, nome, codigo_barras, preco, qtd
        FROM produtos
        WHERE
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            nome,
            'á','a'),'à','a'),'ã','a'),'â','a'),'é','e'),'ê','e'))
          LIKE
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            ?,
            'á','a'),'à','a'),'ã','a'),'â','a'),'é','e'),'ê','e'))
          OR codigo_barras LIKE ?
        ORDER BY nome
        LIMIT 10
      `, [termo, termo]);
  
      res.json(rows);
    } catch (erro) {
      console.error("Erro na busca:", erro);
      res.status(500).json({ erro: "Erro na busca" });
    }
  });

//--- Buscar por Código de Barras específico 
router.get("/produtos/cod/:codigo", verificarToken, async (req, res) => {
  try {
    const codigo = req.params.codigo;
    const [rows] = await conexao.query(
      "SELECT * FROM produtos WHERE codigo_barras = ?",
      [codigo]
    );

    if (rows.length === 0) return res.status(404).json({ erro: "Produto não encontrado" });

    res.json(rows); 
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});
  //--------Atualizar Produtos
  // BUSCAR 1 PRODUTO PARA EDITAR (Protegido)
  router.get("/produtos/cod/:id", verificarToken, async (req, res) => {
    const { id } = req.params;
    const [rows] = await conexao.query(
      "SELECT * FROM produtos WHERE id_produto = ?",
      [id]
    );
    res.json(rows[0]);
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
    module.exports = router;
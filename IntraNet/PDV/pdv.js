const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const app = express()
const porta = 3000
const conexao = require('./db.js')
const multer = require("multer");
const path = require("path");

app.use(express.json())
app.use(cors())

app.listen(porta, () => { 
    console.log(`Servidor rodando em: http://localhost:${porta}`)
})

//--------- PDV

app.use("/imagens", express.static("imagens"));

app.get("/produtos/:codigo", async (req, res) => {
  const { codigo } = req.params;

  const sql = "SELECT * FROM produtos WHERE codigo_barras = ?";

  const [result] = await conexao.query(sql, [codigo]);

  res.json(result);
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});


//----
// ------- cadastro produtos
app.use("/imagens", express.static("imagens"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "imagens/");
  },
  filename: function (req, file, cb) {
    const nomeUnico = Date.now() + path.extname(file.originalname);
    cb(null, nomeUnico);
  }
});

const upload = multer({ storage });

app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    const { nome, preco, codigo_barras } = req.body;
    const precoFormatado = preco.replace(",", ".");

    const imagem = req.file
      ? "/imagens/" + req.file.filename
      : null;

    const sql = `
      INSERT INTO produtos (nome, preco, codigo_barras, img)
      VALUES (?, ?, ?, ?)
    `;

    await conexao.query(sql, [nome, precoFormatado, codigo_barras, imagem]);

    res.json({ mensagem: "Produto cadastrado com sucesso" });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar produto" });
  }
});
app.get("/produtos/:codigo", async (req, res) => {
  try {
    const codigo = req.params.codigo;

    const [rows] = await conexao.query(
      "SELECT * FROM produtos WHERE codigo_barras = ?",
      [codigo]
    );

    if (rows.length === 0) return res.status(404).json({ erro: "Produto não encontrado" });

    res.json(rows); // retorna o produto como array
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
});
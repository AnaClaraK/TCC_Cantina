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

app.use("/imagens", express.static("imagens"));

/* 🔧 AQUI você pode mudar a rota */
app.get("/produtos/:codigo", async (req, res) => {
  const { codigo } = req.params;

  const sql = "SELECT * FROM produtos WHERE codigo_barras = ?";

  const [result] = await conexao.query(sql, [codigo]);

  res.json(result);
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

//----------------------------------------------------------------------------------

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
app.use("/imagens", express.static("imagens"));

app.post("/produtos", upload.single("imagem"), async (req, res) => {
  try {
    const { nome, preco, codigo_barras } = req.body;

    const imagem = "/imagens/" + req.file.filename;

    const sql = `
      INSERT INTO produtos (nome, preco, codigo_barras, imagem)
      VALUES (?, ?, ?, ?)
    `;

    await conexao.query(sql, [nome, preco, codigo_barras, imagem]);

    res.json({ mensagem: "Produto cadastrado com imagem" });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao cadastrar" });
  }
});

//------------------------------------------------

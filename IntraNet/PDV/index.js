const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const app = express()
const porta = 3001
const conexao = require('./db.js')

app.use(express.json())
app.use(cors())

app.listen(porta, () => { 
    console.log(`Servidor rodando em: http://localhost:${porta}`)
})
/* 🔧 AQUI você pode mudar a rota */
app.get("/usuarios", (req, res) => {

  /* 🔧 AQUI você muda o nome da sua tabela */
  const sql = "SELECT * FROM produtos WHERE codigo_barras = ?";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(result);
  });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

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
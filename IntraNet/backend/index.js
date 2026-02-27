const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const app = express()
const mysql = require('mysql2/promise')
const conexao = require('./db.js')
app.use(express.json())
app.use(cors())


app.post("/login", async (req, res) => {
    try {
        const { email } = req.body
        let { senha } = req.body

        senha = senha.trim()

        if (email == "") {
            return res.status(400).json({ "resposta": "Preencha o e-mail" })
        } else if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({ "resposta": "O e-mail deve ter o formato correto" })
        } else if (senha == "") {
            return res.status(400).json({ "resposta": "Preencha a senha" })
        }

        const senhaHashed = crypto.createHash("sha256").update(senha).digest("hex")

        const sql = `SELECT * FROM cadastro WHERE email = ?`

        let [usuarios] = await conexao.query(sql, [email])
        
        if (usuarios.length === 0) {
            return res.status(401).json({ "resposta": "E-mail ou senha inválidos." })
        }

        const usuario = usuarios[0]
        
        if (usuario.senha === senhaHashed) {
            return res.json({ "resposta": "Login realizado com sucesso!" })
        } else {
            return res.status(401).json({ "resposta": "E-mail ou senha inválidos." })
        }

    } catch (error) {
        console.error("Erro no processo de login:", error)
        return res.status(500).json({ "resposta": "Erro interno do Servidor." })
    }
})

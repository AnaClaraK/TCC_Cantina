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

app.post("/cadastro", async (req, res) => {
    try {
        const { email, senha, confsenha } = req.body

        // 1. Validações de preenchimento
        if (!email || email.trim() === "") {
            return res.status(400).json({ "resposta": "Preencha o e-mail" })
        } 
        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({ "resposta": "O e-mail deve ter o formato correto" })
        } 
        if (!senha || senha.trim() === "") {
            return res.status(400).json({ "resposta": "Preencha a senha" })
        }
        if (!confsenha || confsenha.trim() === "") {
            return res.status(400).json({ "resposta": "Confirme a senha" })
        }
        if (senha.trim() !== confsenha.trim()) {
            return res.status(400).json({ "resposta": "As senhas não coincidem" })
        }

        // 2. Verificar se o usuário já existe
        const [usuarios] = await conexao.query("SELECT * FROM cadastro WHERE email = ?", [email])
        
        if (usuarios.length > 0) {
            return res.status(400).json({ "resposta": "Este e-mail já está cadastrado." })
        }

        // 3. Criptografar a senha
        const senhaHashed = crypto.createHash("sha256").update(senha.trim()).digest("hex")

        // 4. SALVAR no banco de dados (O que faltava)
        const sql = "INSERT INTO cadastro (email, senha) VALUES (?, ?)"
        await conexao.query(sql, [email, senhaHashed])

        return res.status(201).json({ "resposta": "Cadastro realizado com sucesso!" })

    } catch (error) {
        console.error("Erro no processo de cadastro:", error)
        return res.status(500).json({ "resposta": "Erro interno do Servidor." })
    }
})

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
const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const conexao = require('../db');
const jwt = require('jsonwebtoken');

const {
    uploadPerfil
} = require('../config/multer');

const verificarToken =
require('../middlewares/auth');

const SECRET =
"C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";

router.post("/cadastrar", async (req, res) => {
    const { nome, cpf, email, senha } = req.body;

    if(email.length <= 3){
        return res.json({"mensagem":"Preencha o e-mail!"})
    }
    if(nome.length <= 3){
        return res.json({"mensagem":"Preencha o nome completo!"})
    }
    if(cpf.length < 11){
        return res.json({"mensagem":"Preencha o CPF!"})
    }

    if(senha.length <= 3){
        return res.json({"mensagem":"Preencha uma senha com no mínimo 7 caracteres"})
    }



    try {
        const novaSenha = await bcrypt.hash(senha, 10);
        await conexao.execute(
            "INSERT INTO users (nome, cpf, email, senha) values (?,?,?,?)", 
            [nome, cpf, email, novaSenha]
        );

        res.json({
            "resposta": "true", 
            "mensagem": "Usuário inserido com sucesso"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            "resposta": "false", 
            "mensagem": "Erro interno no servidor" 
        });
    }
});

router.post("/logar", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [usuarios] = await conexao.execute(`SELECT * FROM users WHERE email = ?`, [email]);

        if (usuarios.length > 0) {
            const usuario = usuarios[0];
            const validou = await bcrypt.compare(senha, usuario.senha);

            if (validou == false) { 
                return res.status(401).json({ "mensagem": "Usuário ou senha inválido!" });
            }

            const token = jwt.sign(
                { email: email },
                SECRET,
                { expiresIn: '1h' }
            );
            return res.json({
                "resposta": "true",
                "token": token,
                "mensagem": "Bem-vindo!"
            });

        } else { 
            return res.json({ "resposta": "false", "mensagem": "E-mail não encontrado!" });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ "resposta": "false", "mensagem": "Erro no servidor" });
    }
    console.log(req.headers.authorization);
});
module.exports = router;
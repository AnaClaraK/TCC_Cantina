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
const SECRET = process.env.API_SEGREDO;

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

            // Opcional: Incluir o id dentro do token para maior segurança
            const token = jwt.sign(
                { email: email, id_user: usuario.id_user || usuario.id },
                SECRET,
                { expiresIn: '8h' }
            );

            // MUDANÇA AQUI: Agora devolvemos o id_user e o nome junto com o token!
            return res.json({
                "resposta": "true",
                "token": token,
                "id_user": usuario.id_user || usuario.id, // Garante o nome correto da coluna do seu banco
                "nome": usuario.nome,
                "mensagem": "Bem-vindo!"
            });

        } else { 
            return res.json({ "resposta": "false", "mensagem": "E-mail não encontrado!" });
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ "resposta": "false", "mensagem": "Erro no servidor" });
    }
});

const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '../../frontend/images');

router.get('/images/:nome', async (req, res) => {
  const base = req.params.nome.replace(/\.(png|jpg|jpeg|webp)$/i, '');

  const exts = ['.png', '.jpg', '.jpeg', '.webp'];

  for (const ext of exts) {
    const filePath = path.join(IMAGE_DIR, base + ext);

    try {
      await fs.promises.access(filePath);
      return res.sendFile(filePath);
    } catch {}
  }

  return res.status(404).send('Imagem não encontrada');
});

router.post("/redefinir-senha", async (req, res) => {
    const { email, novaSenha } = req.body;

    if (!email || email.length <= 3) {
        return res.status(400).json({ "resposta": "false", "mensagem": "Informe um e-mail válido!" });
    }

    if (!novaSenha || novaSenha.length < 7) {
        return res.status(400).json({ "resposta": "false", "mensagem": "A senha deve ter no mínimo 7 caracteres!" });
    }

    try {
        // 1. Verifica se o usuário existe
        const [usuarios] = await conexao.execute(`SELECT * FROM users WHERE email = ?`, [email]);

        if (usuarios.length === 0) {
            return res.status(404).json({ "resposta": "false", "mensagem": "E-mail não encontrado no sistema!" });
        }

        // 2. Gera o hash bcrypt da nova senha
        const senhaHash = await bcrypt.hash(novaSenha, 10);

        // 3. Atualiza a senha no banco de dados
        await conexao.execute(
            `UPDATE users SET senha = ? WHERE email = ?`, 
            [senhaHash, email]
        );

        return res.json({
            "resposta": "true",
            "mensagem": "Senha redefinida com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        return res.status(500).json({ "resposta": "false", "mensagem": "Erro interno no servidor." });
    }
});

module.exports = router;
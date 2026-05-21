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


//-------- Cadastro Funcionários
router.post(
"/cadastro",
uploadPerfil.single("imagem"),
async (req, res) => {

    try {

        const {
            nome,
            email,
            senha,
            confsenha
        } = req.body;

        const imagem = req.file
            ? "/imagens/" + req.file.filename
            : "/imagens/def_avt.jpg";

        // Validações
        if (!nome || nome.trim() === "") {
            return res.status(400).json({
                resposta: "Preencha o nome."
            });
        }

        if (!email || !email.includes("@") || !email.includes(".")) {
            return res.status(400).json({
                resposta: "E-mail inválido."
            });
        }

        if (!senha || !confsenha) {
            return res.status(400).json({
                resposta: "Preencha a senha e a confirmação."
            });
        }

        if (senha !== confsenha) {
            return res.status(400).json({
                resposta: "As senhas não coincidem."
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                resposta:
                "A senha deve ter pelo menos 8 caracteres."
            });
        }

        if (
            !/[!@#$%^&*(),.?\":{}|<>]/.test(senha)
        ) {
            return res.status(400).json({
                resposta:
                "A senha deve conter pelo menos um caractere especial."
            });
        }

        const [usuarios] =
        await conexao.query(
            "SELECT id_cadastro FROM cadastro WHERE email = ?",
            [email.trim()]
        );

        if (usuarios.length > 0) {
            return res.status(400).json({
                resposta:
                "Este e-mail já está cadastrado."
            });
        }

        // BCRYPT
        const senhaHash =
        await bcrypt.hash(
            senha.trim(),
            10
        );

        const sql = `
            INSERT INTO cadastro
            (nome, email, senha, img)
            VALUES (?, ?, ?, ?)
        `;

        await conexao.query(
            sql,
            [
                nome.trim(),
                email.trim(),
                senhaHash,
                imagem
            ]
        );

        return res.status(201).json({
            resposta:
            "Cadastro realizado com sucesso!"
        });

    }
    catch (error) {

        console.error(
            "Erro no cadastro:",
            error
        );

        return res.status(500).json({
            resposta:
            "Erro interno do servidor."
        });
    }
});


//-------- Login Funcionários
router.post(
"/login",
async (req, res) => {

    try {

        const {
            email,
            senha
        } = req.body;

        const sql = `
            SELECT
                id_cadastro,
                nome,
                email,
                senha,
                img
            FROM cadastro
            WHERE email = ?
        `;

        const [usuarios] =
        await conexao.query(
            sql,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                resposta:
                "E-mail ou senha inválidos."
            });
        }

        const usuario =
        usuarios[0];

        // BCRYPT COMPARE
        const senhaValida =
        await bcrypt.compare(
            senha.trim(),
            usuario.senha
        );

        if (!senhaValida) {
            return res.status(401).json({
                resposta:
                "E-mail ou senha inválidos."
            });
        }

        const token =
        jwt.sign(
            {
                id:
                usuario.id_cadastro
            },
            SECRET,
            {
                expiresIn:
                '8h'
            }
        );

        return res.json({

            resposta:
            "Login realizado com sucesso!",

            token,

            usuario: {
                nome:
                usuario.nome,

                foto:
                usuario.img,

                email:
                usuario.email
            }
        });

    }
    catch (error) {

        console.error(
            "Erro no login:",
            error
        );

        return res.status(500).json({
            resposta:
            "Erro interno."
        });
    }
});


//-------- Recuperar Senha
router.put(
"/recuperar-senha",
async (req, res) => {

    try {

        const {
            email,
            novaSenha,
            confirmarSenha
        } = req.body;

        if (
            !email ||
            !novaSenha ||
            !confirmarSenha
        ) {
            return res.status(400).json({
                resposta:
                "Preencha todos os campos."
            });
        }

        if (
            !email.includes("@") ||
            !email.includes(".")
        ) {
            return res.status(400).json({
                resposta:
                "E-mail inválido."
            });
        }

        if (novaSenha.length < 8) {
            return res.status(400).json({
                resposta:
                "A senha deve ter pelo menos 8 caracteres."
            });
        }

        if (
            !/[!@#$%^&*(),.?\":{}|<>]/.test(
                novaSenha
            )
        ) {
            return res.status(400).json({
                resposta:
                "A senha deve conter pelo menos um caractere especial."
            });
        }

        if (
            novaSenha !==
            confirmarSenha
        ) {
            return res.status(400).json({
                resposta:
                "As senhas não coincidem."
            });
        }

        const [usuarios] =
        await conexao.query(
            "SELECT id_cadastro FROM cadastro WHERE email = ?",
            [email.trim()]
        );

        if (
            usuarios.length === 0
        ) {
            return res.status(404).json({
                resposta:
                "E-mail não encontrado."
            });
        }

        // BCRYPT
        const senhaHash =
        await bcrypt.hash(
            novaSenha.trim(),
            10
        );

        await conexao.query(
            "UPDATE cadastro SET senha = ? WHERE email = ?",
            [
                senhaHash,
                email.trim()
            ]
        );

        return res.json({
            resposta:
            "Senha redefinida com sucesso!"
        });

    }
    catch (error) {

        console.error(
            "Erro ao redefinir senha:",
            error
        );

        return res.status(500).json({
            resposta:
            "Erro interno do servidor."
        });
    }
});

module.exports = router;
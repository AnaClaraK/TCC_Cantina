const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // <-- CORREÇÃO: Faltava importar o bcrypt

const conexao = require('../db');
const verificarToken = require('../middlewares/auth');
const { uploadPerfil } = require('../config/multer');

const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";

// ----- Atualizar perfil (Protegido)
router.put("/perfil/atualizar", verificarToken, uploadPerfil.single("imagem"), async (req, res) => {
    try {
        const { nome, email, emailAntigo, senha_atual, nova_senha } = req.body;

        const resultado = await conexao.query("SELECT * FROM cadastro WHERE email = ?", [emailAntigo]);
        const usuarios = Array.isArray(resultado[0]) ? resultado[0] : resultado;

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({ resposta: "Usuário não encontrado." });
        }

        const usuario = usuarios[0];

        if (nova_senha && nova_senha.trim() !== "") {
            if (!senha_atual) {
                return res.status(400).json({ resposta: "Informe a senha atual para cadastrar uma nova." });
            }

            const senhaValida = await bcrypt.compare(senha_atual, usuario.senha);
            if (!senhaValida) {
                return res.status(400).json({ resposta: "A senha atual está incorreta." });
            }

            const hashNovaSenha = await bcrypt.hash(nova_senha, 10);
            await conexao.query("UPDATE cadastro SET senha = ? WHERE email = ?", [hashNovaSenha, emailAntigo]);
        }

        // Salva apenas o nome do arquivo no banco
        let nomeArquivo = req.file ? req.file.filename : usuario.img;

        await conexao.query("UPDATE cadastro SET nome = ?, email = ?, img = ? WHERE email = ?", [
            nome, email, nomeArquivo, emailAntigo
        ]);

        // Trata o caminho para incluir a subpasta /imagens/
        const caminhoFotoTratado = nomeArquivo ? (nomeArquivo.startsWith('/imagens/') ? nomeArquivo : `/imagens/${nomeArquivo}`) : null;

        return res.json({
            resposta: "Perfil atualizado com sucesso!",
            novoNome: nome,
            novoEmail: email,
            novaFoto: caminhoFotoTratado // Propriedade ajustada para "novaFoto"
        });

    } catch (erro) {
        console.error("Erro na atualização de perfil:", erro);
        return res.status(500).json({ resposta: "Erro interno no servidor ao atualizar perfil." });
    }
});

module.exports = router;
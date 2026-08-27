const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const conexao = require('../db');
const verificarToken = require('../middlewares/auth');
const { uploadPerfil } = require('../config/multer');

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

        let nomeArquivo = req.file ? req.file.filename : usuario.img;

        await conexao.query("UPDATE cadastro SET nome = ?, email = ?, img = ? WHERE email = ?", [
            nome, email, nomeArquivo, emailAntigo
        ]);

        const caminhoFotoTratado = nomeArquivo ? (nomeArquivo.startsWith('/imagens/') ? nomeArquivo : `/imagens/${nomeArquivo}`) : null;

        return res.json({
            resposta: "Perfil atualizado com sucesso!",
            novoNome: nome,
            novoEmail: email,
            novaFoto: caminhoFotoTratado
        });

    } catch (erro) {
        console.error("Erro na atualização de perfil:", erro);
        return res.status(500).json({ resposta: "Erro interno no servidor ao atualizar perfil." });
    }
});

// ----- Buscar dados do perfil logado (Protegido)
router.get("/perfil/meus-dados", verificarToken, async (req, res) => {
    try {
        const dadosToken = req.usuario || req.user;

        if (!dadosToken) {
            return res.status(401).json({ resposta: "Usuário não autenticado." });
        }

        // Pega o e-mail independente de vir como objeto ou string direta no token
        const emailUsuario = typeof dadosToken === 'string' ? dadosToken : (dadosToken.email || dadosToken.sub);

        let query = "SELECT nome, email, img FROM cadastro WHERE email = ?";
        let params = [emailUsuario];

        if (!emailUsuario && dadosToken.id) {
            query = "SELECT nome, email, img FROM cadastro WHERE id = ?";
            params = [dadosToken.id];
        }

        const resultado = await conexao.query(query, params);
        const usuarios = Array.isArray(resultado[0]) ? resultado[0] : resultado;

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({ resposta: "Usuário não encontrado." });
        }

        const usuario = usuarios[0];
        const nomeArquivo = usuario.img;
        
        const caminhoFotoTratado = nomeArquivo ? (nomeArquivo.startsWith('/imagens/') ? nomeArquivo : `/imagens/${nomeArquivo}`) : null;

        return res.json({
            nome: usuario.nome,
            email: usuario.email,
            foto: caminhoFotoTratado
        });

    } catch (erro) {
        console.error("Erro ao buscar perfil:", erro);
        return res.status(500).json({ resposta: "Erro interno no servidor." });
    }
});

module.exports = router;
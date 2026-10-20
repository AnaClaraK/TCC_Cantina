const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const conexao = require('../db');
const verificarToken = require('../middlewares/auth');
const { uploadPerfil } = require('../config/multer');

// Atualizar perfil (protegido). Primeiro tenta o ID presente no token;
// se o middleware não expuser esse campo, usa o e-mail atual enviado pelo APP.
router.put('/perfil/atualizar', verificarToken, uploadPerfil.single('imagem'), async (req, res) => {
    try {
        const { nome, email, emailAntigo, senha_atual, nova_senha } = req.body;
        const identidade = req.usuario || req.user || {};
        const idToken = identidade.id_cadastro ?? identidade.id_user ?? identidade.id_usuario ?? identidade.id;

        let usuarios = [];

        if (idToken !== undefined && idToken !== null && String(idToken).trim() !== '') {
            const resultadoId = await conexao.query(
                'SELECT id_cadastro, nome, email, senha, img FROM cadastro WHERE id_cadastro = ?',
                [idToken]
            );
            usuarios = Array.isArray(resultadoId[0]) ? resultadoId[0] : resultadoId;
        }

        // Compatibilidade com o middleware/token atual e com versões anteriores do APP.
        if ((!usuarios || usuarios.length === 0) && emailAntigo && emailAntigo.trim()) {
            const resultadoEmail = await conexao.query(
                'SELECT id_cadastro, nome, email, senha, img FROM cadastro WHERE email = ? LIMIT 1',
                [emailAntigo.trim()]
            );
            usuarios = Array.isArray(resultadoEmail[0]) ? resultadoEmail[0] : resultadoEmail;
        }

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({ resposta: 'Usuário não encontrado. Confira se a conta continua conectada e tente novamente.' });
        }

        const usuario = usuarios[0];
        const usuarioId = usuario.id_cadastro;

        // Evita trocar o e-mail por outro já cadastrado.
        const emailNovo = typeof email === 'string' && email.trim() ? email.trim() : usuario.email;
        if (emailNovo !== usuario.email) {
            const resultadoEmailExistente = await conexao.query(
                'SELECT id_cadastro FROM cadastro WHERE email = ? AND id_cadastro <> ?',
                [emailNovo, usuarioId]
            );
            const emailsExistentes = Array.isArray(resultadoEmailExistente[0])
                ? resultadoEmailExistente[0]
                : resultadoEmailExistente;

            if (emailsExistentes.length > 0) {
                return res.status(409).json({ resposta: 'Este e-mail já está cadastrado em outra conta.' });
            }
        }

        if (nova_senha && nova_senha.trim() !== '') {
            if (!senha_atual) {
                return res.status(400).json({ resposta: 'Informe a senha atual para cadastrar uma nova.' });
            }

            const senhaValida = await bcrypt.compare(senha_atual, usuario.senha);
            if (!senhaValida) {
                return res.status(400).json({ resposta: 'A senha atual está incorreta.' });
            }

            const hashNovaSenha = await bcrypt.hash(nova_senha, 10);
            await conexao.query('UPDATE cadastro SET senha = ? WHERE id_cadastro = ?', [hashNovaSenha, usuarioId]);
        }

        const nomeAtualizado = typeof nome === 'string' && nome.trim() ? nome.trim() : usuario.nome;
        const nomeArquivo = req.file ? req.file.filename : usuario.img;

        await conexao.query(
            'UPDATE cadastro SET nome = ?, email = ?, img = ? WHERE id_cadastro = ?',
            [nomeAtualizado, emailNovo, nomeArquivo, usuarioId]
        );

        const caminhoFotoTratado = nomeArquivo
            ? (nomeArquivo.startsWith('/imagens/') ? nomeArquivo : `/imagens/${nomeArquivo}`)
            : null;

        return res.json({
            resposta: 'Perfil atualizado com sucesso!',
            novoNome: nomeAtualizado,
            novoEmail: emailNovo,
            novaFoto: caminhoFotoTratado
        });
    } catch (erro) {
        console.error('Erro na atualização de perfil:', erro);
        return res.status(500).json({ resposta: 'Erro interno no servidor ao atualizar perfil.' });
    }
});

// Obter dados do usuário logado (mantém o contrato usado pelo sistema existente).
router.get('/perfil/meus-dados', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario?.id;
        const sql = `
            SELECT id_cadastro, nome, email, img
            FROM cadastro
            WHERE id_cadastro = ?
        `;
        const [usuarios] = await conexao.query(sql, [usuarioId]);

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({ resposta: 'Usuário não encontrado.' });
        }

        const usuario = usuarios[0];
        return res.json({
            id: usuario.id_cadastro,
            nome: usuario.nome,
            email: usuario.email,
            foto: usuario.img
        });
    } catch (erro) {
        console.error('Erro ao buscar dados do perfil:', erro);
        return res.status(500).json({ resposta: 'Erro interno do servidor.' });
    }
});

module.exports = router;

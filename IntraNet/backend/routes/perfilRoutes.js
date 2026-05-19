const express =
require('express');

const router =
express.Router();

const crypto =
require('crypto');

const conexao =
require('../db');

const verificarToken =
require('../middlewares/auth');

const {
  uploadPerfil
} =
require('../config/multer');
const SECRET = "C@ntina_Pr0jeto_2025_!#Z0ne_S3cur3";

// ----- Atualizar perfil (Protegido)
router.put("/perfil/atualizar", verificarToken, uploadPerfil.single("imagem"), async (req, res) => {
    try {
        const {
            nome,
            email,
            emailAntigo,
            senha_atual,
            nova_senha,
            conf_senha
        } = req.body;
  
        if (!nome || nome.trim() === "") {
            return res.status(400).json({
                resposta: "O nome é obrigatório."
            });
        }
  
        if (!email || !email.includes("@") || !email.includes(".")) {
            return res.status(400).json({
                resposta: "E-mail inválido."
            });
        }
  
        const [usuarios] = await conexao.query(
            "SELECT senha FROM cadastro WHERE email = ?",
            [emailAntigo]
        );
  
        if (usuarios.length === 0) {
            return res.status(404).json({
                resposta: "Usuário não encontrado."
            });
        }
  
        let senhaSql = "";
        let fotoSql = "";
        let params = [nome.trim(), email.trim()];
  
        if (nova_senha || conf_senha) {
            if (!senha_atual) {
                return res.status(400).json({
                    resposta: "Informe sua senha atual."
                });
            }
  
            const senhaAtualHash = crypto
                .createHash("sha256")
                .update(senha_atual.trim())
                .digest("hex");
  
            if (senhaAtualHash !== usuarios[0].senha) {
                return res.status(401).json({
                    resposta: "Senha atual incorreta."
                });
            }
  
            if (nova_senha !== conf_senha) {
                return res.status(400).json({
                    resposta: "A nova senha e a confirmação não coincidem."
                });
            }
  
            if (nova_senha.length < 8) {
                return res.status(400).json({
                    resposta: "A nova senha deve ter pelo menos 8 caracteres."
                });
            }
  
            if (!/[!@#$%^&*(),.?\":{}|<>]/.test(nova_senha)) {
                return res.status(400).json({
                    resposta: "A nova senha deve conter pelo menos um caractere especial."
                });
            }
  
            const novaSenhaHash = crypto
                .createHash("sha256")
                .update(nova_senha.trim())
                .digest("hex");
  
            senhaSql = ", senha = ?";
            params.push(novaSenhaHash);
        }
  
        let novaFotoPath = null;
        if (req.file) {
            novaFotoPath = `/imagens/${req.file.filename}`;
            fotoSql = ", img = ?";
            params.push(novaFotoPath);
        }
  
        params.push(emailAntigo);
  
        const sql = `
            UPDATE cadastro
            SET nome = ?, email = ?
            ${senhaSql}
            ${fotoSql}
            WHERE email = ?
        `;
  
        await conexao.query(sql, params);
  
        return res.json({
            resposta: "Perfil atualizado com sucesso!",
            novoNome: nome.trim(),
            novoEmail: email.trim(),
            novaFoto: novaFotoPath
        });
  
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        return res.status(500).json({
            resposta: "Erro ao atualizar perfil."
        });
    }
  });
  module.exports = router;
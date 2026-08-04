const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const conexao = require('../db');
const jwt = require('jsonwebtoken');

// Importa o arquivo de monitoramento e logs que criamos no passo anterior
const monitor = require('../monitoramento');

const {
    uploadPerfil
} = require('../config/multer');

const verificarToken = require('../middlewares/auth');

require('dotenv').config(); 
const SECRET = process.env.API_SEGREDO;

//-------- Cadastro Funcionários
router.post(
"/cadastro",
uploadPerfil.single("imagem"),
async (req, res) => {
    // Registra a atividade na API
    monitor.volumeRequisicoes.mark();

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
            return res.status(400).json({ resposta: "Preencha o nome." });
        }

        if (!email || !email.includes("@") || !email.includes(".")) {
            return res.status(400).json({ resposta: "E-mail inválido." });
        }

        if (!senha || !confsenha) {
            return res.status(400).json({ resposta: "Preencha a senha e a confirmação." });
        }

        if (senha !== confsenha) {
            return res.status(400).json({ resposta: "As senhas não coincidem." });
        }

        if (senha.length < 8) {
            return res.status(400).json({ resposta: "A senha deve ter pelo menos 8 caracteres." });
        }

        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(senha)) {
            return res.status(400).json({ resposta: "A senha deve conter pelo menos um caractere especial." });
        }

        const [usuarios] = await conexao.query(
            "SELECT id_cadastro FROM cadastro WHERE email = ?",
            [email.trim()]
        );

        if (usuarios.length > 0) {
            monitor.gravarLogDoDia('alerta', `Tentativa de cadastro com e-mail já existente: ${email.trim()}`);
            return res.status(400).json({ resposta: "Este e-mail já está cadastrado." });
        }

        // BCRYPT
        const senhaHash = await bcrypt.hash(senha.trim(), 10);

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

        // Define o status do banco como ativo (1) e salva os logs de sucesso
        monitor.statusBanco.set(1);
        monitor.gravarLogDoDia('sucesso', `Novo funcionário cadastrado: ${email.trim()} (${nome.trim()})`);

        return res.status(201).json({
            resposta: "Cadastro realizado com sucesso!"
        });

    }
    catch (error) {
        monitor.statusBanco.set(0); // Marca falha de comunicação ou erro estrutural do banco
        monitor.gravarLogDoDia('erro', `Erro ao realizar cadastro: ${error.message}`);

        console.error("Erro no cadastro:", error);
        return res.status(500).json({ resposta: "Erro interno do servidor." });
    }
});


//-------- Login Funcionários
router.post(
"/login",
async (req, res) => {
    // Registra a atividade na API
    monitor.volumeRequisicoes.mark();

    try {
        const { email, senha } = req.body;

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

        const [usuarios] = await conexao.query(sql, [email]);

        if (usuarios.length === 0) {
            // Sobe o contador de erros no painel e cria um log de alerta diário
            monitor.errosLogin.inc();
            monitor.gravarLogDoDia('alerta', `Tentativa de login falhou (Usuário não existe): ${email}`);

            return res.status(401).json({ resposta: "E-mail ou senha inválidos." });
        }

        const usuario = usuarios[0];

        // BCRYPT COMPARE
        const senhaValida = await bcrypt.compare(senha.trim(), usuario.senha);

        if (!senhaValida) {
            // Sobe o contador de erros no painel e cria um log de alerta diário
            monitor.errosLogin.inc();
            monitor.gravarLogDoDia('alerta', `Tentativa de login falhou (Senha incorreta) para o usuário: ${email}`);

            return res.status(401).json({ resposta: "E-mail ou senha inválidos." });
        }

        const token = jwt.sign(
            { id: usuario.id_cadastro },
            SECRET,
            { expiresIn: '8h' }
        );

        // Atualiza as métricas do PM2 Plus e grava o log do dia no HD
        monitor.totalLogins.inc();
        monitor.statusBanco.set(1);
        monitor.gravarLogDoDia('sucesso', `Funcionário logado no sistema: ${usuario.email}`);

        return res.json({
            resposta: "Login realizado com sucesso!",
            token,
            usuario: {
                nome: usuario.nome,
                foto: usuario.img,
                email: usuario.email
            }
        });

    }
    catch (error) {
        monitor.statusBanco.set(0); // Banco falhou ou caiu
        monitor.gravarLogDoDia('erro', `Erro crítico no processo de login: ${error.message}`);

        console.error("Erro no login:", error);
        return res.status(500).json({ resposta: "Erro interno." });
    }
});


//-------- Recuperar Senha
router.put(
"/recuperar-senha",
async (req, res) => {
    monitor.volumeRequisicoes.mark();

    try {
        const {
            email,
            novaSenha,
            confirmarSenha
        } = req.body;

        if (!email || !novaSenha || !confirmarSenha) {
            return res.status(400).json({ resposta: "Preencha todos os campos." });
        }

        if (!email.includes("@") || !email.includes(".")) {
            return res.status(400).json({ resposta: "E-mail inválido." });
        }

        if (novaSenha.length < 8) {
            return res.status(400).json({ resposta: "A senha deve ter pelo menos 8 caracteres." });
        }

        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(novaSenha)) {
            return res.status(400).json({ resposta: "A senha deve conter pelo menos um caractere especial." });
        }

        if (novaSenha !== confirmarSenha) {
            return res.status(400).json({ resposta: "As senhas não coincidem." });
        }

        const [usuarios] = await conexao.query(
            "SELECT id_cadastro FROM cadastro WHERE email = ?",
            [email.trim()]
        );

        if (usuarios.length === 0) {
            monitor.gravarLogDoDia('alerta', `Tentativa de recuperação de senha para e-mail não existente: ${email.trim()}`);
            return res.status(404).json({ resposta: "E-mail não encontrado." });
        }

        // BCRYPT
        const senhaHash = await bcrypt.hash(novaSenha.trim(), 10);

        await conexao.query(
            "UPDATE cadastro SET senha = ? WHERE email = ?",
            [senhaHash, email.trim()]
        );

        // Loga a redefinição com sucesso
        monitor.statusBanco.set(1);
        monitor.gravarLogDoDia('sucesso', `Senha redefinida com sucesso para o usuário: ${email.trim()}`);

        return res.json({ resposta: "Senha redefinida com sucesso!" });

    }
    catch (error) {
        monitor.statusBanco.set(0);
        monitor.gravarLogDoDia('erro', `Erro ao redefinir a senha do usuário: ${error.message}`);

        console.error("Erro ao redefinir senha:", error);
        return res.status(500).json({ resposta: "Erro interno do servidor." });
    }
});

// =========================================================================
// ROTA TEMPORÁRIA PARA LIBERAR ACESSO DA REDE (Rode apenas uma vez!)
// =========================================================================
router.get('/liberar-rede', async (req, res) => {
    try {
        // 1. Libera o usuário root para se conectar de QUALQUER IP (%) usando a senha 'admin'
        await conexao.query(`
            GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' 
            IDENTIFIED BY 'admin' 
            WITH GRANT OPTION
        `);

        // 2. Atualiza as permissões na memória do MariaDB na hora
        await conexao.query('FLUSH PRIVILEGES');

        console.log("👉 REDE LIBERADA: O outro PC já pode se conectar usando o seu IP principal!");
        return res.send("<h1>Sucesso! Permissões de rede liberadas no MariaDB.</h1>");

    } catch (error) {
        console.error("Erro ao liberar a rede no banco:", error);
        return res.status(500).send("<h1>Erro ao liberar acesso: " + error.message + "</h1>");
    }
});

module.exports = router;
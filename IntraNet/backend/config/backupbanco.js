const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const util = require("util");

const execFileAsync = util.promisify(execFile);

// =====================================================
// CONFIGURAÇÃO
// =====================================================

// Pasta onde os backups serão salvos
const pastaBackups = path.join(__dirname, "backups");

// Cria a pasta automaticamente caso ainda não exista
if (!fs.existsSync(pastaBackups)) {
    fs.mkdirSync(pastaBackups, { recursive: true });
}

// Caminho do mysqldump instalado junto com o MariaDB
const executavel = "C:\\Program Files\\MariaDB 13.0\\bin\\mysqldump.exe";

// =====================================================
// BACKUP DO BANCO
// =====================================================

async function fazerBackupBanco() {
    try {
        require("dotenv").config();

        // Usa EXATAMENTE as mesmas variáveis do db.js
        const host = process.env.DB_LOCAL || "localhost";
        const porta = process.env.DB_PORTA || "3306";
        const usuario = process.env.DB_USER || "root";
        const senha = process.env.DB_PASSWORD || "";
        const banco = process.env.DB_DATABASE;

        if (!banco) {
            throw new Error(
                "DB_DATABASE não foi definido no arquivo .env."
            );
        }

        // Data e hora para identificar o arquivo
        const agora = new Date();

        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        const hora = String(agora.getHours()).padStart(2, "0");
        const minuto = String(agora.getMinutes()).padStart(2, "0");
        const segundo = String(agora.getSeconds()).padStart(2, "0");

        const nomeArquivo =
            `backup_${ano}-${mes}-${dia}_${hora}-${minuto}-${segundo}.sql`;

        const caminhoArquivo =
            path.join(pastaBackups, nomeArquivo);

        console.log("========================================");
        console.log("Iniciando backup do banco...");
        console.log(`Banco: ${banco}`);
        console.log(`Host: ${host}`);
        console.log(`Porta: ${porta}`);
        console.log(`Usuário: ${usuario}`);
        console.log(`Executável: ${executavel}`);
        console.log(`Arquivo: ${caminhoArquivo}`);
        console.log("========================================");

        const argumentos = [
            `--host=${host}`,
            `--port=${porta}`,
            `--user=${usuario}`,
            "--single-transaction",
            "--routines",
            "--events",
            "--triggers"
        ];

        // Só adiciona a senha se existir
        if (senha) {
            argumentos.push(`--password=${senha}`);
        }

        // Nome do banco por último
        argumentos.push(banco);

        const resultado = await execFileAsync(
            executavel,
            argumentos,
            {
                maxBuffer: 1024 * 1024 * 200,
                windowsHide: true
            }
        );

        // Salva o resultado do mysqldump no arquivo .sql
        fs.writeFileSync(
            caminhoArquivo,
            resultado.stdout,
            "utf8"
        );

        // Confirma que o arquivo realmente foi criado
        if (!fs.existsSync(caminhoArquivo)) {
            throw new Error(
                "O mysqldump terminou, mas o arquivo de backup não foi criado."
            );
        }

        const tamanho = fs.statSync(caminhoArquivo).size;

        if (tamanho === 0) {
            fs.unlinkSync(caminhoArquivo);

            throw new Error(
                "O arquivo de backup foi criado vazio."
            );
        }

        console.log("========================================");
        console.log("BACKUP REALIZADO COM SUCESSO!");
        console.log(`Arquivo: ${caminhoArquivo}`);
        console.log(`Tamanho: ${tamanho} bytes`);
        console.log("========================================");

        return {
            sucesso: true,
            arquivo: caminhoArquivo,
            nome: nomeArquivo
        };

    } catch (erro) {

        console.error("========================================");
        console.error("ERRO AO FAZER BACKUP DO BANCO:");
        console.error(erro.message);

        if (erro.stderr) {
            console.error("Detalhes do mysqldump:");
            console.error(erro.stderr);
        }

        console.error("========================================");

        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

module.exports = fazerBackupBanco;
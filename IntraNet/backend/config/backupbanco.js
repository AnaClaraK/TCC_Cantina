const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const util = require("util");

const execFileAsync = util.promisify(execFile);

const pastaBackups = path.join(__dirname, "backups");
if (!fs.existsSync(pastaBackups)) {
    fs.mkdirSync(pastaBackups, { recursive: true });
}

const executavel = "C:\\Program Files\\MariaDB 13.0\\bin\\mysqldump.exe";

async function fazerBackupBanco() {
    try {
        require("dotenv").config();

        const host = process.env.DB_LOCAL || "localhost";
        const porta = process.env.DB_PORTA || "3306";
        const usuario = process.env.DB_USER || "root";
        const senha = process.env.DB_PASSWORD || "";
        const banco = process.env.DB_DATABASE;

        if (!banco) {
            throw new Error("DB_DATABASE não foi definido no arquivo .env.");
        }

        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        const dia = String(agora.getDate()).padStart(2, "0");
        const hora = String(agora.getHours()).padStart(2, "0");
        const minuto = String(agora.getMinutes()).padStart(2, "0");
        const segundo = String(agora.getSeconds()).padStart(2, "0");

        const nomeArquivo = `backup_${ano}-${mes}-${dia}_${hora}-${minuto}-${segundo}.sql`;
        const caminhoArquivo = path.join(pastaBackups, nomeArquivo);

        console.log("Iniciando backup do banco...");
        console.log(`Banco: ${banco} | Host: ${host}:${porta} | Usuário: ${usuario}`);

        const argumentos = [
            `--host=${host}`,
            `--port=${porta}`,
            `--user=${usuario}`,
            "--single-transaction",
            "--routines",
            "--events",
            "--triggers"
        ];

        if (senha) {
            argumentos.push(`--password=${senha}`);
        }
        argumentos.push(banco);

        const resultado = await execFileAsync(executavel, argumentos, {
            maxBuffer: 1024 * 1024 * 200,
            windowsHide: true
        });

        fs.writeFileSync(caminhoArquivo, resultado.stdout, "utf8");

        if (!fs.existsSync(caminhoArquivo)) {
            throw new Error("O mysqldump terminou, mas o arquivo de backup não foi criado.");
        }

        const tamanho = fs.statSync(caminhoArquivo).size;
        if (tamanho === 0) {
            fs.unlinkSync(caminhoArquivo);
            throw new Error("O arquivo de backup foi criado vazio.");
        }

        console.log(`Backup realizado: ${caminhoArquivo} (${tamanho} bytes)`);
        return {
            sucesso: true,
            arquivo: caminhoArquivo,
            nome: nomeArquivo
        };
    } catch (erro) {
        console.error("Erro ao fazer backup do banco:", erro.message);
        if (erro.stderr) {
            console.error("Detalhes:", erro.stderr);
        }
        return {
            sucesso: false,
            erro: erro.message
        };
    }
}

module.exports = fazerBackupBanco;

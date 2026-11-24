require('dotenv').config();
const io = require('@pm2/io');
const fs = require('fs');
const path = require('path');

const totalLogins = io.counter({
    name: 'Total de Logins Hoje',
    id: 'cantina/logins/sucesso',
    unit: 'logins'
});

const errosLogin = io.counter({
    name: 'Erros de Login Hoje',
    id: 'cantina/logins/erros',
    unit: 'erros'
});

const volumeRequisicoes = io.meter({
    name: 'Volume de Requisições',
    id: 'cantina/requisicoes/volume',
    unit: 'req/sec'
});

const statusBanco = io.metric({
    name: 'Status do Banco de Dados',
    id: 'cantina/banco/status',
    unit: 'estado'
});

function gravarLogDoDia(tipo, mensagem) {
    try {
        const dataHoje = new Date().toISOString().split('T')[0];
        const horaAgora = new Date().toLocaleTimeString('pt-BR');
        const pastaLogs = path.join(__dirname, 'logs_cantina');
        if (!fs.existsSync(pastaLogs)) {
            fs.mkdirSync(pastaLogs);
        }
        const caminhoArquivo = path.join(pastaLogs, `${dataHoje}.txt`);
        const linhaLog = `[${horaAgora}] [${tipo.toUpperCase()}] - ${mensagem}\n`;
        fs.appendFileSync(caminhoArquivo, linhaLog);
    } catch (error) {
        console.error('Falha interna ao gravar arquivo de log diário:', error);
    }
}

module.exports = {
    totalLogins,
    errosLogin,
    volumeRequisicoes,
    statusBanco,
    gravarLogDoDia
};

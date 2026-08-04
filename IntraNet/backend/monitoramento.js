// backend/monitoramento.js
require('dotenv').config();
const io = require('@pm2/io');
const fs = require('fs');
const path = require('path');

// =========================================================================
// 1. MÉTRICAS PERSONALIZADAS (CUSTOM METRICS) - PM2 PLUS
// =========================================================================

// Contador: Aumenta a cada login feito com sucesso
const totalLogins = io.counter({
    name: 'Total de Logins Hoje',
    id: 'cantina/logins/sucesso',
    unit: 'logins'
});

// Contador: Aumenta a cada tentativa com erro (bom para ver se tem alguém tentando hackear)
const errosLogin = io.counter({
    name: 'Erros de Login Hoje',
    id: 'cantina/logins/erros',
    unit: 'erros'
});

// Meter: Mede a frequência de requisições por segundo na API da Cantina
const volumeRequisicoes = io.meter({
    name: 'Volume de Requisições',
    id: 'cantina/requisicoes/volume',
    unit: 'req/sec'
});

// Metric: Mostra em tempo real se o banco de dados MariaDB está respondendo
const statusBanco = io.metric({
    name: 'Status do Banco de Dados',
    id: 'cantina/banco/status',
    unit: 'estado' // 1 para Online, 0 para Erro
});


// =========================================================================
// 2. FUNÇÃO AUXILIAR PARA GERAR LOGS DO DIA
// =========================================================================
function gravarLogDoDia(tipo, mensagem) {
    try {
        const dataHoje = new Date().toISOString().split('T')[0]; // Formato: AAAA-MM-DD
        const horaAgora = new Date().toLocaleTimeString('pt-BR');
        
        // Cria uma pasta chamada 'logs_cantina' dentro do seu backend, se ela não existir
        const pastaLogs = path.join(__dirname, 'logs_cantina');
        if (!fs.existsSync(pastaLogs)) {
            fs.mkdirSync(pastaLogs);
        }

        // Nome do arquivo baseado na data de hoje (ex: 2026-06-15.txt)
        const caminhoArquivo = path.join(pastaLogs, `${dataHoje}.txt`);
        const linhaLog = `[${horaAgora}] [${tipo.toUpperCase()}] - ${mensagem}\n`;

        // Salva sem apagar o que já tinha no dia
        fs.appendFileSync(caminhoArquivo, linhaLog);
    } catch (error) {
        console.error('Falha interna ao gravar arquivo de log diário:', error);
    }
}

// Exporta as métricas e a função de log para usar nas outras rotas
module.exports = {
    totalLogins,
    errosLogin,
    volumeRequisicoes,
    statusBanco,
    gravarLogDoDia
};
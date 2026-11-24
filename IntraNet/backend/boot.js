const { execSync } = require('child_process');
const path = require('path');

console.log('>>> [BOOT] Verificando atualizações no GitHub...');

try {
    const gitOutput = execSync('git pull origin main', { encoding: 'utf-8' });
    console.log('>>> [BOOT] Git Status:', gitOutput);
    execSync('npm install', { encoding: 'utf-8' });
    console.log('>>> [BOOT] Dependências checadas.');
} catch (error) {
    console.error('>>> [BOOT] Erro na atualização automática:', error.message);
}

console.log('>>> [BOOT] Iniciando servidor principal...');
require(path.join(__dirname, 'app.js'));

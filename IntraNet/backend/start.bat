@echo off
cd /d "%~dp0"

echo ===================================================
echo   ATUALIZANDO SISTEMA NO BOOT DA MÁQUINA
echo ===================================================

:: Puxa as alterações da branch main
git pull origin main

:: Instala novas dependências caso existam
call npm install

:: Recarrega ou inicia a aplicação no PM2
call pm2 reload ecosystem.config.js || call pm2 start ecosystem.config.js

echo ===================================================
echo   SISTEMA PRONTO PARA USO!
echo ===================================================
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

:: Inicia o Ngrok com o domínio fixo (caso ainda não esteja rodando)
tasklist /fi "imagename eq ngrok.exe" | find /i "ngrok.exe" >nul
if errorlevel 1 (
    echo Iniciando o túnel Ngrok com domínio fixo...
    start "Ngrok Cantina" cmd /k "npx ngrok http 3000 --domain=resource-dragonfly-arguably.ngrok-free.dev"
) else (
    echo O túnel Ngrok já está rodando!
)

echo ===================================================
echo   SISTEMA PRONTO PARA USO!
echo ===================================================
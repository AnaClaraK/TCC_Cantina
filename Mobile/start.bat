@echo off
setlocal
title Inicializacao - TCC Cantina

echo ==========================================
echo        INICIANDO AMBIENTE GRANO VITA
echo ==========================================

:: CAMINHOS
set "ROOT=C:\Users\50572398808\Ana\TCC_Cantina"
set "CARDAPIO_FILE=%ROOT%\intranet\frontend\landing_page\cardapio.html"

:: ATENCAO: confirmar a porta utilizada pelo backend.
:: 3000 e apenas um valor provisório.
set "INTRANET_URL=http://localhost:3000/"

:: 1. CONFIGURA JAVA
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

:: 1.1. ATUALIZA O SISTEMA (GIT & DEPENDENCIAS)
echo.
echo [0/5] Baixando atualizacoes do GitHub...
cd /d "%ROOT%"
call git pull origin main
call npm install

if exist "%ROOT%\Mobile\package.json" (
echo Atualizando dependencias do Mobile...
cd /d "%ROOT%\Mobile"
call npm install
cd /d "%ROOT%"
)

:: 2. INICIA BACKEND VIA PM2
echo.
echo [1/5] Iniciando API via PM2...
call pm2 reload ecosystem.config.js || call pm2 start ecosystem.config.js

:: 3. ABRE MONITOR DO PM2
echo.
echo [2/5] Abrindo monitor do PM2...
start "PM2 Monitor" cmd /k "pm2 monit"

:: 4. INICIA METRO DO EXPO
echo.
echo [3/5] Iniciando servidor Expo...
start "Expo Metro Server" cmd /k "cd /d %ROOT%\Mobile && npx expo start"

:: 5. AGUARDA O BACKEND
echo.
echo [4/5] Aguardando inicializacao dos servidores...
timeout /t 5 /nobreak >nul

:: 6. ABRE CARDAPIO E INTRANET EM MODO KIOSK
echo.
echo [5/5] Preparando telas em modo Kiosk...

if not exist "%CARDAPIO_FILE%" (
echo ERRO: cardapio.html nao encontrado!
echo Caminho: %CARDAPIO_FILE%
pause
exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"Add-Type -AssemblyName System.Windows.Forms; ^
$screens = [System.Windows.Forms.Screen]::AllScreens; ^
$primary = $screens | Where-Object { $*.Primary } | Select-Object -First 1; ^
$secondary = $screens | Where-Object { -not $*.Primary } | Select-Object -First 1; ^
$edge = Join-Path${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'; ^
if (-not (Test-Path $edge)) { $edge = Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe' }; ^
if (-not (Test-Path $edge)) { $edge = 'msedge.exe' }; ^
$cardUrl = ([System.Uri]$env:CARDAPIO_FILE).AbsoluteUri; ^
if ($secondary) { ^
Write-Host 'Abrindo sistema na tela principal...'; ^
$b = $primary.Bounds; ^
$argsSistema = '--kiosk ' + $env:INTRANET_URL + ' --edge-kiosk-type=fullscreen --window-position=' + $b.X + ',' + $b.Y + ' --window-size=' + $b.Width + ',' + $b.Height + ' --user-data-dir=' + $env:TEMP + '\\GranoVita-Sistema --no-first-run'; ^
Start-Process -FilePath $edge -ArgumentList $argsSistema; ^
Start-Sleep -Seconds 3; ^
Write-Host 'Abrindo cardapio na segunda tela...'; ^
$b = $secondary.Bounds; ^
$argsCardapio = '--kiosk ' + $cardUrl + ' --edge-kiosk-type=fullscreen --window-position=' + $b.X + ',' + $b.Y + ' --window-size=' + $b.Width + ',' + $b.Height + ' --user-data-dir=' + $env:TEMP + '\\GranoVita-Cardapio --no-first-run'; ^
Start-Process -FilePath $edge -ArgumentList $argsCardapio; ^
} else { ^
Write-Host 'Somente uma tela detectada. Priorizando o cardapio.'; ^
$b = $primary.Bounds; ^
$argsCardapio = '--kiosk ' + $cardUrl + ' --edge-kiosk-type=fullscreen --window-position=' + $b.X + ',' + $b.Y + ' --window-size=' + $b.Width + ',' + $b.Height + ' --user-data-dir=' + $env:TEMP + '\\GranoVita-Cardapio --no-first-run'; ^
Start-Process -FilePath $edge -ArgumentList $argsCardapio; ^
}"
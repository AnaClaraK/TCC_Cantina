@echo off
setlocal
title Inicializacao - TCC Cantina

cd /d "%~dp0"
set "ROOT=%CD%"
set "BACKEND_DIR=%ROOT%\"
set "INTRANET_URL=http://localhost:3000/"
set "CARDAPIO_URL=http://localhost:3000/landing_page/cardapio.html"
set "NGROK_DOMAIN=SEU-DOMINIO-FIXO.ngrok-free.app"
set "NPM_CONFIG_CACHE=%USERPROFILE%\.npm-cache"

:: 1. ENCERRA PROCESSOS ANTIGOS E INICIA BACKEND OCULTO EM PRODUCAO
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1

if exist "%BACKEND_DIR%\app.js" (
    powershell -NoProfile -WindowStyle Hidden -Command "$env:NODE_ENV='production'; Start-Process -FilePath 'node.exe' -ArgumentList 'app.js' -WorkingDirectory '%BACKEND_DIR%' -WindowStyle Hidden"
) else (
    echo ERRO: app.js nao encontrado em "%BACKEND_DIR%"
    pause
    exit /b
)

:: 2. AGUARDA O SERVIDOR NA PORTA 3000 FICAR PRONTO (ATE 15 SEGUNDOS)
powershell -NoProfile -Command "for ($i=0; $i -lt 30; $i++) { if (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet) { break }; Start-Sleep -Milliseconds 500 }"

:: 3. INICIA O NGROK OCULTO APONTANDO PARA A PORTA 3000
set "NGROK_EXE=ngrok.exe"
if exist "%ROOT%\ngrok.exe" set "NGROK_EXE=%ROOT%\ngrok.exe"
if not exist "%NGROK_EXE%" if exist "C:\Users\50572398808\Ana\TCC_Cantina\node_modules\ngrok\bin\ngrok.exe" set "NGROK_EXE=C:\Users\50572398808\Ana\TCC_Cantina\node_modules\ngrok\bin\ngrok.exe"

powershell -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath '%NGROK_EXE%' -ArgumentList 'http', '--domain=%NGROK_DOMAIN%', '3000' -WindowStyle Hidden"

:: 4. LOCALIZA O GOOGLE CHROME E ABRE SISTEMA (LOGIN) E CARDAPIO
set "CHROME_EXE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if not defined CHROME_EXE (
    echo ERRO: Google Chrome nao encontrado neste computador!
    pause
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; $screens = [System.Windows.Forms.Screen]::AllScreens; $primary = $screens | Where-Object { $_.Primary } | Select-Object -First 1; $secondary = $screens | Where-Object { -not $_.Primary } | Select-Object -First 1; $chrome = $env:CHROME_EXE; $profileDir = Join-Path $env:TEMP 'GranoVita-Chrome'; if ($secondary) { $b1 = $primary.Bounds; $b2 = $secondary.Bounds; Start-Process $chrome -ArgumentList '--new-window', '--kiosk', $env:INTRANET_URL, ('--window-position=' + $b1.X + ',' + $b1.Y), ('--window-size=' + $b1.Width + ',' + $b1.Height), ('--user-data-dir=' + $profileDir), '--no-first-run', '--no-default-browser-check'; Start-Sleep -Seconds 2; Start-Process $chrome -ArgumentList '--new-window', '--kiosk', $env:CARDAPIO_URL, ('--window-position=' + $b2.X + ',' + $b2.Y), ('--window-size=' + $b2.Width + ',' + $b2.Height), ('--user-data-dir=' + $profileDir), '--no-first-run', '--no-default-browser-check' } else { $b1 = $primary.Bounds; Start-Process $chrome -ArgumentList '--new-window', '--kiosk', $env:CARDAPIO_URL, ('--window-position=' + $b1.X + ',' + $b1.Y), ('--window-size=' + $b1.Width + ',' + $b1.Height), ('--user-data-dir=' + $profileDir), '--no-first-run', '--no-default-browser-check'; Start-Sleep -Seconds 2; Start-Process $chrome -ArgumentList '--new-window', '--kiosk', $env:INTRANET_URL, ('--window-position=' + $b1.X + ',' + $b1.Y), ('--window-size=' + $b1.Width + ',' + $b1.Height), ('--user-data-dir=' + $profileDir), '--no-first-run', '--no-default-browser-check' }"

exit
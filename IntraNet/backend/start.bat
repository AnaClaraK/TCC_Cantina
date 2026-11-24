@echo off
setlocal
title Inicializacao - TCC Cantina

cd /d "%~dp0"
set "ROOT=%CD%"
set "BACKEND_DIR=%ROOT%\IntraNet\backend"
set "INTRANET_URL=http://localhost:3000/"
set "CARDAPIO_URL=http://localhost:3000/landing_page/cardapio.html"
set "NPM_CONFIG_CACHE=%USERPROFILE%\.npm-cache"

:: 1. PUXA ATUALIZACOES DO GITHUB
git pull origin main

:: 2. ENCERRA INSTANCIAS ANTIGAS DO NODE E INICIA BACKEND OCULTO EM PRODUCAO
taskkill /F /IM node.exe >nul 2>&1

if exist "%BACKEND_DIR%\app.js" (
    powershell -NoProfile -WindowStyle Hidden -Command "$env:NODE_ENV='production'; Start-Process -FilePath 'node.exe' -ArgumentList 'app.js' -WorkingDirectory '%BACKEND_DIR%' -WindowStyle Hidden"
) else (
    echo ERRO: app.js nao encontrado em "%BACKEND_DIR%"
    pause
    exit /b
)

:: 3. AGUARDA O SERVIDOR NA PORTA 3000 FICAR PRONTO (ATE 15 SEGUNDOS)
powershell -NoProfile -Command "for ($i=0; $i -lt 30; $i++) { if (Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet) { break }; Start-Sleep -Milliseconds 500 }"

:: 4. ABRE SISTEMA (LOGIN) E CARDAPIO VIA HTTP NO GOOGLE CHROME
powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; $screens = [System.Windows.Forms.Screen]::AllScreens; $primary = $screens | Where-Object { $_.Primary } | Select-Object -First 1; $secondary = $screens | Where-Object { -not $_.Primary } | Select-Object -First 1; $chrome = '${env:ProgramFiles}\Google\Chrome\Application\chrome.exe'; if (-not (Test-Path $chrome)) { $chrome = '${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe' }; if (-not (Test-Path $chrome)) { $chrome = '${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe' }; if (-not (Test-Path $chrome)) { $chrome = 'chrome.exe' }; if ($secondary) { $b1 = $primary.Bounds; Start-Process -FilePath $chrome -ArgumentList ('--kiosk', '%INTRANET_URL%', \"--window-position=$($b1.X),$($b1.Y)\", \"--window-size=$($b1.Width),$($b1.Height)\", \"--user-data-dir=$env:TEMP\GranoVita-Chrome-Sistema\", '--no-first-run', '--no-default-browser-check'); Start-Sleep -Seconds 2; $b2 = $secondary.Bounds; Start-Process -FilePath $chrome -ArgumentList ('--kiosk', '%CARDAPIO_URL%', \"--window-position=$($b2.X),$($b2.Y)\", \"--window-size=$($b2.Width),$($b2.Height)\", \"--user-data-dir=$env:TEMP\GranoVita-Chrome-Cardapio\", '--no-first-run', '--no-default-browser-check') } else { $b1 = $primary.Bounds; Start-Process -FilePath $chrome -ArgumentList ('--kiosk', '%CARDAPIO_URL%', \"--window-position=$($b1.X),$($b1.Y)\", \"--window-size=$($b1.Width),$($b1.Height)\", \"--user-data-dir=$env:TEMP\GranoVita-Chrome-Cardapio\", '--no-first-run', '--no-default-browser-check'); Start-Sleep -Seconds 2; Start-Process -FilePath $chrome -ArgumentList ('--kiosk', '%INTRANET_URL%', \"--window-position=$($b1.X),$($b1.Y)\", \"--window-size=$($b1.Width),$($b1.Height)\", \"--user-data-dir=$env:TEMP\GranoVita-Chrome-Sistema\", '--no-first-run', '--no-default-browser-check') }"

exit
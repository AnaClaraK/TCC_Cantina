@echo off
setlocal

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"

:: =========================================================
:: ABRE O PDV EM TELA CHEIA (F11)
:: =========================================================

start "" "%CHROME%" ^
--app="http://localhost:3000" ^
--user-data-dir="%appdata%\CantinaChromePDV" ^
--start-fullscreen

timeout /t 3 /nobreak >nul

exit
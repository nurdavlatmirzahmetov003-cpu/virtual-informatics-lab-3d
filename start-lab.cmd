@echo off
rem Double-click (or run from any folder): starts the lab server and the site together.
cd /d "%~dp0"
if not exist node_modules call npm install
if not exist .env copy .env.example .env >nul
rem open the browser once the site has had a few seconds to start
start "" /min cmd /c "timeout /t 6 >nul & start http://localhost:5173"
npm start

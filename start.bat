@echo off
chcp 65001 >nul
title Virtual Informatics Lab 3D
cd /d "%~dp0"
if not exist node_modules (
  echo [1/2] npm install...
  call npm install || goto :error
)
echo [2/2] npm run dev  -^>  http://localhost:5173
start "" http://localhost:5173
call npm run dev
goto :eof
:error
echo npm install failed. Node.js 20+ is required: https://nodejs.org
pause

@echo off
title Totally Baked Pemba - Servidor de Entregas & Rastreio GPS
cd /d "%~dp0"
echo ================================================================
echo    Totally Baked Pemba - Sistema de Entregas e Rastreio GPS
echo ================================================================
echo.
echo Iniciando servidor Express...
echo.
echo  Website & Menu:   http://localhost:3000/
echo  Menu Online:       http://localhost:3000/menu
echo  Rastreio GPS:      http://localhost:3000/rastreio/ord-01
echo  Painel Admin:      http://localhost:3000/admin
echo.
echo Pressione Ctrl+C para encerrar o servidor a qualquer momento.
echo.
npm start
pause

@echo off
title Document Analysis Chatbot
color 0a
echo.
echo ========================================
echo   DOCUMENT ANALYSIS CHATBOT STARTING
echo ========================================
echo.

echo [1] Stopping any existing server...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2] Installing dependencies if needed...
call npm install --no-audit

echo [3] Starting server...
echo [4] Open: http://localhost:3002
echo [5] Then open index.html in browser
echo.
echo ========================================
node server.js
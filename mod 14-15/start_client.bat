@echo off
title StockSense - Frontend Web App
color 0A
echo ========================================================
echo        Starting StockSense Frontend (Vite)
echo ========================================================
echo.
cd /d "%~dp0client"
npm run dev
pause

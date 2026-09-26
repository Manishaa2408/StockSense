@echo off
title StockSense - Backend API Server
color 0B
echo ========================================================
echo        Starting StockSense Backend API Server
echo ========================================================
echo.
cd /d "%~dp0server"
npm run dev
pause

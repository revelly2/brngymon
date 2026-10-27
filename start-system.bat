@echo off
title Barangay Health Monitoring System Launcher
color 0A

echo ======================================================
echo    BARANGAY HEALTH MONITORING SYSTEM
echo    Starting local server and opening system...
echo ======================================================
echo.

:: Navigate to script directory
cd /d "%~dp0"

:: Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org/ to run this system.
    echo.
    pause
    exit /b 1
)

:: Verify dependencies are present
if not exist "node_modules\" (
    echo [INFO] First time setup detected. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install project dependencies.
        pause
        exit /b 1
    )
)

echo [1/2] Launching default web browser at http://localhost:3000...
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

echo [2/2] Starting Next.js application server...
echo.
echo ------------------------------------------------------
echo  Press Ctrl+C in this terminal window to stop the system.
echo ------------------------------------------------------
echo.

call npm run dev

pause

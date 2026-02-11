@echo off
REM ============================================
REM OMNI-OPS ALL-IN-ONE LAUNCHER
REM ============================================
REM Launches the game with AI view mode enabled
REM Press F4 for AI Live Cam
REM Press F5 for AI Chat/Control Panel
REM ============================================

color 0A
title OMNI-OPS - AI View Mode Launcher

echo.
echo ========================================
echo    OMNI-OPS GAME LAUNCHER
echo    AI View Mode Edition
echo ========================================
echo.
echo [*] Initializing game systems...
echo.

REM Check if screenshots folder exists
if not exist "screenshots" (
    echo [*] Creating screenshots folder...
    mkdir screenshots
    echo [+] Screenshots folder created
) else (
    echo [+] Screenshots folder found
)

REM Check for required files
echo.
echo [*] Checking game files...
if not exist "index.html" (
    echo [!] ERROR: index.html not found!
    pause
    exit /b 1
)

if not exist "js\omni-core-game.js" (
    echo [!] ERROR: Core game files missing!
    pause
    exit /b 1
)

if not exist "js\omni-ai-tester.js" (
    echo [!] WARNING: AI Tester not found
) else (
    echo [+] AI Tester loaded
)

if not exist "js\omni-ai-livecam.js" (
    echo [!] WARNING: AI Live Cam not found
) else (
    echo [+] AI Live Cam loaded
)

echo.
echo [*] Starting local web server...
echo.

REM Try to find Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [+] Python found - Starting HTTP server on port 8000
    echo.
    echo ========================================
    echo    GAME IS RUNNING
    echo ========================================
    echo.
    echo Open your browser and go to:
    echo    http://localhost:8000/index.html
    echo.
    echo AI CONTROLS:
    echo    F4  = AI Live Cam (watch AI play)
    echo    F5  = AI Chat Panel (control AI)
    echo    TAB = Pip-Boy Menu
    echo    M   = Tactical Mode
    echo    ESC = Settings
    echo.
    echo Press CTRL+C to stop the server
    echo ========================================
    echo.
    start http://localhost:8000/index.html
    python -m http.server 8000
    goto :end
)

REM Try Python3
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [+] Python3 found - Starting HTTP server on port 8000
    echo.
    echo ========================================
    echo    GAME IS RUNNING
    echo ========================================
    echo.
    echo Open your browser and go to:
    echo    http://localhost:8000/index.html
    echo.
    echo AI CONTROLS:
    echo    F4  = AI Live Cam
    echo    F5  = AI Chat Panel
    echo.
    echo Press CTRL+C to stop the server
    echo ========================================
    echo.
    start http://localhost:8000/index.html
    python3 -m http.server 8000
    goto :end
)

REM No Python found - open directly
echo [!] Python not found - Opening file directly
echo [!] Some features may not work without a server
echo.
pause
start "" "index.html"

:end
echo.
echo [*] Server stopped
pause

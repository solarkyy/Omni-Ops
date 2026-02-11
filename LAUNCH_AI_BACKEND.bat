@echo off
REM ==========================================
REM OMNI-OPS AI SYSTEM LAUNCHER
REM Complete AI-powered gaming with vision
REM ==========================================

color 0A
title OMNI-OPS - AI Backend System

echo.
echo ========================================
echo    OMNI-OPS AI BACKEND LAUNCHER
echo    Intelligent AI with Vision Support
echo ========================================
echo.

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] ERROR: Python not found!
    echo [!] Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [+] Python found

REM Check if .env exists
if not exist ".env" (
    echo.
    echo [!] WARNING: .env file not found
    echo [*] Creating from .env.example...
    copy ".env.example" ".env" >nul
    echo.
    echo [!] IMPORTANT: Edit .env and add your AI API keys!
    echo [!] You need at least one of:
    echo     - ANTHROPIC_API_KEY (Claude - Recommended)
    echo     - OPENAI_API_KEY (GPT-4)
    echo     - MOONSHOT_API_KEY (Kimi)
    echo.
    pause
)

REM Check dependencies
echo [*] Checking Python dependencies...
pip show anthropic >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [*] Installing Anthropic SDK...
    pip install anthropic
)

pip show openai >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [*] Installing OpenAI SDK...
    pip install openai
)

pip show websockets >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [*] Installing WebSockets...
    pip install websockets
)

pip show python-dotenv >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [*] Installing python-dotenv...
    pip install python-dotenv
)

REM Ensure screenshots folder
if not exist "screenshots" mkdir screenshots

echo.
echo ========================================
echo    STARTING AI BACKEND SERVER
echo ========================================
echo.
echo The AI server provides:
echo   [✓] Vision-based game analysis
echo   [✓] Intelligent chat responses
echo   [✓] Autonomous gameplay (if enabled)
echo   [✓] Real-time tactical advice
echo.
echo Controls in-game:
echo   F4  = AI Live Cam (vision view)
echo   F5  = AI Chat Panel (control)
echo   📸  = Capture & analyze screenshot
echo.
echo ========================================
echo.

REM Start game server in background
start /b cmd /c "python -m http.server 8000 >nul 2>&1"
echo [+] Game server started on port 8000
timeout /t 2 >nul

REM Open game in browser
start http://localhost:8000/index.html
echo [+] Game opened in browser

echo.
echo [*] Starting AI backend server...
echo.

REM Start AI server (foreground)
python ai_backend_server.py

REM Cleanup on exit
echo.
echo [*] Shutting down servers...
taskkill /f /im python.exe /fi "WINDOWTITLE eq *http.server*" >nul 2>nul
pause

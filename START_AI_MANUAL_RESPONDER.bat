@echo off
echo ============================================================
echo   AI MANUAL RESPONDER - Interactive Response System
echo ============================================================
echo.
echo This opens an interactive terminal where YOU can respond
echo to questions from the in-game AI in real-time!
echo.
echo Make sure the bridge is running first!
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python first.
    pause
    exit /b 1
)

REM Check/install required packages
echo Checking required packages...
python -c "import websockets" >nul 2>&1
if errorlevel 1 (
    echo Installing websockets...
    pip install websockets
)

python -c "import aioconsole" >nul 2>&1
if errorlevel 1 (
    echo Installing aioconsole...
    pip install aioconsole
)

echo.
echo ============================================================
echo Starting AI Manual Responder...
echo ============================================================
echo.
echo You'll be able to type responses to in-game AI questions!
echo Type 'help' for commands.
echo.

REM Start the responder
python ai_manual_responder.py

pause

@echo off
echo ============================================================
echo   START AI CHAT SYSTEM - Three-Way Collaboration
echo ============================================================
echo.
echo Starting the complete AI chat system...
echo.
echo This will:
echo   1. Start the collaboration bridge (Python)
echo   2. Open the chat interface in your browser
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

echo.
echo ============================================================
echo Starting AI Collaboration Bridge...
echo ============================================================
echo.

REM Start the bridge in a new window
start "AI Collaboration Bridge" cmd /k "python ai_collaborative_bridge.py"

REM Wait a moment for bridge to start
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo Opening Chat Interface...
echo ============================================================
echo.

REM Open the chat interface in default browser
start "" "ai_chat_interface.html"

echo.
echo ============================================================
echo   CHAT SYSTEM STARTED!
echo ============================================================
echo.
echo Bridge is running in separate window
echo Chat interface opened in your browser
echo.
echo You can now talk with the in-game AI and external AI!
echo.
echo To stop: Close the bridge window
echo.
pause

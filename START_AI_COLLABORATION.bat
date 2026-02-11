@echo off
echo ========================================
echo  AI COLLABORATIVE DIAGNOSTICS SYSTEM
echo ========================================
echo.
echo Starting AI Collaboration Bridge...
echo This enables AI-to-AI communication for
echo autonomous problem detection and solving
echo.
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check for required packages
echo Checking dependencies...
pip install websockets >nul 2>&1

REM Start the collaborative bridge
echo.
echo Starting Collaborative Bridge...
echo HTTP API: http://localhost:8080
echo WebSocket: ws://localhost:8081
echo.
echo The bridge will enable:
echo   - AI-to-AI communication
echo   - Autonomous problem detection
echo   - Auto-fix capabilities
echo   - Real-time diagnostics
echo.
echo Press Ctrl+C to stop
echo.

python ai_collaborative_bridge.py

pause

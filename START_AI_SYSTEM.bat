@echo off
REM Omni-Ops Complete AI System Launcher
REM Double-click to start the entire interconnected AI system

echo.
echo ================================================================
echo  OMNI-OPS: AI VISION & CONTROL SYSTEM LAUNCHER
echo ================================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Install Python from python.org
    pause
    exit /b 1
)

REM Check Anthropic
python -c "import anthropic" >nul 2>&1
if errorlevel 1 (
    echo Installing Anthropic API...
    pip install anthropic
)

REM Start the system
echo Launching AI System...
python START_COMPLETE_AI_SYSTEM.py

pause

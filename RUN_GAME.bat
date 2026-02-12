@echo off
REM OMNI-OPS: Run Game with Integrated AI System
REM Everything runs in the browser - click and play!

echo.
echo ================================================================
echo  OMNI-OPS: GAME WITH AI SYSTEM
echo  All systems integrated in the browser!
echo ================================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Install from: python.org
    pause
    exit /b 1
)

echo Starting game server...
echo.
python RUN_GAME_WITH_AI.py

pause

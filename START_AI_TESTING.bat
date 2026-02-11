@echo off
echo ========================================
echo OMNI OPS - AI In-Game Testing System
echo ========================================
echo.
echo Starting servers...
echo.

REM Start the game server in a new window
start "Omni Ops Game Server" cmd /k "python -m http.server 8000"
timeout /t 2 /nobreak >nul

REM Start the AI testing bridge
echo Starting AI testing bridge...
python start_ai_testing.py

pause

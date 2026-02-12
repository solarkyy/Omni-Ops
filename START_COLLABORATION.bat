@echo off
REM ============================================================
REM AI COLLABORATION CENTER - MASTER STARTUP SCRIPT
REM ============================================================
REM This script does everything needed to run the full workflow
REM ============================================================

echo.
echo ============================================================
echo  AI COLLABORATION CENTER - MASTER STARTUP
echo ============================================================
echo.

REM Set working directory
cd /d "C:\Users\kjoly\OneDrive\Desktop\Omni Ops"

echo [1/3] Starting HTTP Server on localhost:8000...
echo.

REM Start HTTP server in background
start "Game Server" python -m http.server 8000

REM Wait for server to start
timeout /t 3 /nobreak

echo [2/3] Starting AI Collaboration Orchestrator...
echo.

REM Start the orchestrator
python orchestrate_workflow.py

echo [3/3] Done!
echo.
echo ============================================================
echo  WATCH YOUR BROWSER FOR THE AI COLLABORATION CENTER
echo ============================================================
echo.
pause

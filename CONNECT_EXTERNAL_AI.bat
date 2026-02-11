@echo off
echo ============================================================
echo   EXTERNAL AI CONNECTOR - Connect Claude to In-Game AI
echo ============================================================
echo.
echo This will connect an external AI (Claude) to the in-game AI
echo so they can have intelligent conversations.
echo.
echo REQUIREMENTS:
echo   1. AI Collaboration Bridge must be running first
echo   2. Game must be open in browser
echo   3. Python with 'aiohttp' and 'websockets' packages
echo.
echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python first.
    pause
    exit /b 1
)

echo Python: OK
echo.
echo Checking required packages...
python -c "import websockets" >nul 2>&1
if errorlevel 1 (
    echo Installing websockets package...
    pip install websockets
)

python -c "import aiohttp" >nul 2>&1
if errorlevel 1 (
    echo Installing aiohttp package...
    pip install aiohttp
)

echo Packages: OK
echo.
echo ============================================================
echo Starting External AI Connector...
echo ============================================================
echo.
echo The connector will:
echo   - Connect to the collaboration bridge
echo   - Listen for questions from in-game AI
echo   - Display visual context (screenshots)
echo   - Enable AI-to-AI conversations
echo.
echo Press Ctrl+C to stop
echo.
python ai_external_connector.py

pause

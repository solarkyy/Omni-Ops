@echo off
title ONE CLICK AI SYSTEM - Everything You Need!
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║        🚀 ONE CLICK AI SYSTEM - SUPER EASY MODE 🚀             ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo This will start EVERYTHING you need:
echo   ✅ Game Server
echo   ✅ AI Bridge
echo   ✅ Vision Brain Bridge (for AI Live Cam)
echo   ✅ LLM Responder (connects to LM Studio)
echo.
echo After this starts:
echo   1. Make sure LM Studio has Qwen3 VL 8B loaded and server running
echo   2. Browser opens automatically
echo   3. Press F3 in game, open Chat tab
echo   4. Press F4 to open AI Live Cam and watch AI play
echo   5. Ask questions and AI responds!
echo.
echo ════════════════════════════════════════════════════════════════
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python not found!
    echo.
    echo Please install Python first:
    echo   https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ Python found!
echo.

REM Check required packages
echo Checking required packages...
python -c "import aiohttp" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Missing package: aiohttp
    echo Installing now...
    pip install aiohttp
    echo.
)

echo ✅ All packages installed!
echo.

echo ════════════════════════════════════════════════════════════════
echo   STARTING ALL SERVICES...
echo ════════════════════════════════════════════════════════════════
echo.

REM Start Game Server in a new window
echo [1/4] Starting Game Server...
start "Game Server (Port 8000)" cmd /k "python -m http.server 8000"
timeout /t 2 >nul

echo ✅ Game Server started!
echo.

REM Start AI Bridge in a new window
echo [2/4] Starting AI Collaboration Bridge...
start "AI Bridge (Port 8080/8081)" cmd /k "python ai_collaborative_bridge.py"
timeout /t 3 >nul

echo ✅ AI Bridge started!
echo.

REM Start Vision Brain Bridge in a new window
echo [3/4] Starting AI Vision Brain Bridge...
start "Vision Brain Bridge (Port 8082)" cmd /k "python ai_vision_brain_bridge.py"
timeout /t 2 >nul

echo ✅ Vision Brain Bridge started!
echo.

REM Start LLM Responder in a new window
echo [4/4] Starting Local LLM Responder...
start "LLM Responder (LM Studio)" cmd /k "python ai_auto_local_llm_responder.py"
timeout /t 2 >nul

echo ✅ LLM Responder started!
echo.

echo ════════════════════════════════════════════════════════════════
echo   ✨ EVERYTHING IS READY! ✨
echo ════════════════════════════════════════════════════════════════
echo.
echo 📋 SERVICES RUNNING:
echo.
echo   1. ✅ Game Server - RUNNING (new window)
echo   2. ✅ AI Bridge - RUNNING (new window)
echo   3. ✅ Vision Brain Bridge - RUNNING (new window)
echo   4. ✅ LLM Responder - RUNNING (new window)
echo   5. ⚠️  LM Studio - Make sure it's running:
echo      • Open LM Studio
echo      • Local Server tab
echo      • Load "Qwen3 VL 8B" model
echo      • Click "Start Server"
echo.
echo 🎮 READY TO PLAY:
echo.
echo   → Browser will open automatically
echo   → Press F3 in game - Chat with AI
echo   → Press F4 in game - Watch AI Live Cam
echo   → Type your question and press Enter
echo   → AI responds with vision!
echo.
echo ════════════════════════════════════════════════════════════════
echo.
echo 💡 TIP: Keep all 4 windows OPEN while you play.
echo          Minimize them if you want.
echo.
echo Press any key to open the game in your browser...
pause >nul

REM Open browser to game
start http://localhost:8000

echo.
echo ✅ Browser opened! Have fun!
echo.
echo This window can stay open or you can close it.
echo The other 4 windows (Game Server, AI Bridge, Vision Brain, LLM Responder)
echo must stay OPEN while you play!
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause

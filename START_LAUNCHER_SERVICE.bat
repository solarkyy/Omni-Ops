@echo off
echo ============================================================
echo   AI LAUNCHER SERVICE - Background Service
echo ============================================================
echo.
echo This service runs in the background and allows the
echo collab button to start the AI chat system with one click!
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    pause
    exit /b 1
)

echo Starting launcher service...
echo.
echo ============================================================
echo   LAUNCHER SERVICE RUNNING
echo ============================================================
echo.
echo The 🤝 AI COLLAB button can now start the chat system!
echo.
echo Leave this window OPEN in the background.
echo Minimize it if you want, but don't close it.
echo.
echo When you click the collab button in the game:
echo   ✅ AI Bridge starts automatically
echo   ✅ Local LLM Responder starts automatically
echo   ✅ Chat opens in browser
echo   ✅ Everything ready in 3 seconds!
echo.
echo 💡 TIP: Use 🚀 ONE_CLICK_START_AI.bat for even easier setup!
echo.
echo Press Ctrl+C to stop the launcher service.
echo ============================================================
echo.

python ai_launcher_service.py

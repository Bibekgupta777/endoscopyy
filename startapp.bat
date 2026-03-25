@echo off
title Endoscopy Launcher

:: Go to the folder where this .bat file is located
cd /d "%~dp0"

:: Move into the backend folder
cd backend

echo ============================================
echo    STARTING ENDOSCOPY APPLICATION
echo ============================================
echo.
echo Starting MongoDB Server... Please wait...
echo.

:: Start the server in a NEW window
start "Endoscopy Server - DO NOT CLOSE" cmd /k "node server.js"

echo Waiting for server to start...
echo.

:: Wait 5 seconds (longer wait to be safe)
ping 127.0.0.1 -n 6 > NUL

echo Opening Google Chrome...
echo.

:: Try to open Chrome
start "" "http://127.0.0.1:5000"

echo ============================================
echo    APP IS NOW RUNNING!
echo    
echo    If Chrome did not open automatically,
echo    open Chrome manually and go to:
echo    http://127.0.0.1:5000
echo ============================================
echo.
pause
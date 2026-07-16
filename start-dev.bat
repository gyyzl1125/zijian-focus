@echo off
cd /d "%~dp0"
echo Zijian dev server is starting...
echo.
echo Open on this computer:
echo http://127.0.0.1:5174/index.html?v=8
echo.
echo Open on your phone:
echo Use this computer's Wi-Fi IPv4 address, for example:
echo http://YOUR_WIFI_IP:5174/index.html?v=8
echo.
echo Keep this window open while using the app.
echo Press Ctrl+C to stop.
echo.
python -m http.server 5174 --bind 0.0.0.0
pause

@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 open-report.py
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  python open-report.py
  goto :end
)
echo Python не найден. Установите Python 3 или запустите отчет через локальный сервер.
pause
:end

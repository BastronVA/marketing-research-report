#!/usr/bin/env bash
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 open-report.py
elif command -v python >/dev/null 2>&1; then
  python open-report.py
else
  echo "Python не найден. Установите Python 3 или запустите отчёт через локальный сервер."
  read -r -p "Нажмите Enter для выхода..."
fi

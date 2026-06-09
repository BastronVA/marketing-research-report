#!/usr/bin/env python3
"""Start a tiny local preview server for the interactive report."""
from __future__ import annotations

import functools
import http.server
import socket
import sys
import webbrowser
from pathlib import Path

REPORT_ID = "crp-2026-06-09"
HOST = "localhost"
START_PORT = 8000


def find_free_port(start: int = START_PORT) -> int:
    for port in range(start, start + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind((HOST, port))
            except OSError:
                continue
            return port
    raise RuntimeError("Не удалось найти свободный порт от 8000 до 8099.")


def main() -> int:
    root = Path(__file__).resolve().parent
    port = find_free_port()
    url = f"http://{HOST}:{port}/?report={REPORT_ID}"
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    server = http.server.ThreadingHTTPServer((HOST, port), handler)

    print("Интерактивный отчёт запущен.")
    print(f"Откройте в браузере: {url}")
    print("Чтобы остановить сервер, закройте это окно или нажмите Ctrl+C.")
    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

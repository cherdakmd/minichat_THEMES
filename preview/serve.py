#!/usr/bin/env python3
"""Мини-сервер для локального превью тем Minichat.

Маршруты (имитируют структуру каталогов Minichat):
  /Additions/*  -> preview/stubs/Additions/*  (заглушки vue/animate/widget)
  /Images/*     -> preview/stubs/Images/*     (иконки сервисов)
  /themes/<Имя>/* -> /<Имя>/*                 (папки тем в корне репозитория)

Запуск:  python3 preview/serve.py   (порт: env PORT, по умолчанию 8123)
"""
import http.server
import os
import posixpath
import socketserver
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUBS = os.path.join(ROOT, 'preview', 'stubs')
PORT = int(os.environ.get('PORT', '8123'))

ROUTES = {
    '/Additions/': os.path.join(STUBS, 'Additions'),
    '/Images/': os.path.join(STUBS, 'Images'),
    '/themes/': ROOT,
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        path = urllib.parse.urlsplit(path).path
        for prefix, base in ROUTES.items():
            if path.startswith(prefix):
                rel = posixpath.normpath(path[len(prefix):])
                if rel.startswith('..') or os.path.isabs(rel):
                    return os.path.join(ROOT, '_forbidden')
                return os.path.join(base, rel.replace('/', os.sep))
        return super().translate_path(path)

    def do_GET(self):
        path = urllib.parse.urlsplit(self.path).path
        if path in ('/', '/index.html'):
            self.send_response(302)
            self.send_header('Location', '/preview/index.html')
            self.end_headers()
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    with Server(('0.0.0.0', PORT), Handler) as httpd:
        print(f'Minichat themes preview: http://0.0.0.0:{PORT}/preview/index.html')
        httpd.serve_forever()

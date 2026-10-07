#!/usr/bin/env python3
"""Static server for testing on the local network. Unlike `python -m http.server` it answers
HTTP Range requests, which iOS Safari requires to play a video (GitHub Pages supports them)."""
import os, re, socket, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        self.remaining = None
        match = re.match(r'bytes=(\d*)-(\d*)$', self.headers.get('Range', ''))
        path = self.translate_path(self.path)
        if not match or not os.path.isfile(path):
            return super().send_head()

        size = os.path.getsize(path)
        start, end = match.groups()
        if start == '':  # suffix range: last N bytes
            first, last = max(size - int(end or 0), 0), size - 1
        else:
            first, last = int(start), int(end) if end else size - 1
        last = min(last, size - 1)
        if first > last:
            self.send_error(416)
            return None

        f = open(path, 'rb')
        f.seek(first)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {first}-{last}/{size}')
        self.send_header('Content-Length', str(last - first + 1))
        self.end_headers()
        self.remaining = last - first + 1
        return f

    def copyfile(self, source, outputfile):
        if self.remaining is None:
            return super().copyfile(source, outputfile)
        while self.remaining > 0:
            chunk = source.read(min(65536, self.remaining))
            if not chunk:
                break
            try:
                outputfile.write(chunk)
            except (BrokenPipeError, ConnectionResetError):
                break
            self.remaining -= len(chunk)

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    for ip in sorted({i[4][0] for i in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)}):
        print(f'http://{ip}:{port}/', flush=True)
    ThreadingHTTPServer(('0.0.0.0', port), Handler).serve_forever()

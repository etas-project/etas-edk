#!/usr/bin/env python3
import argparse
import http.server
import socketserver
import sys


class LoopbackHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        return

    def write_response(self, status, body, headers=None):
        payload = body.encode("utf-8")
        self.send_response(status)
        self.send_header("content-length", str(len(payload)))
        self.send_header("connection", "close")
        if headers:
            for name, value in headers.items():
                self.send_header(name, value)
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path == "/hello":
            self.write_response(
                200,
                "hello",
                {"content-type": "text/plain", "x-edk-loopback": "yes"},
            )
            return
        if self.path == "/large":
            self.write_response(
                200,
                "0123456789abcdef0123456789abcdef0123456789abcdef",
                {"content-type": "text/plain"},
            )
            return
        if self.path == "/malformed":
            self.connection.sendall(b"not-http\r\ncontent-length: 5\r\n\r\nerror")
            self.connection.close()
            return
        self.write_response(404, "missing", {"content-type": "text/plain"})

    def do_POST(self):
        if self.path != "/echo":
            self.write_response(404, "missing", {"content-type": "text/plain"})
            return
        length = int(self.headers.get("content-length", "0"))
        body = self.rfile.read(length).decode("utf-8")
        self.write_response(200, "POST:" + body, {"content-type": "text/plain"})


class ThreadingLoopbackServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port-file", required=True)
    args = parser.parse_args()

    server = ThreadingLoopbackServer(("127.0.0.1", 0), LoopbackHandler)
    port = server.server_address[1]
    with open(args.port_file, "w", encoding="utf-8") as handle:
        handle.write(str(port))
    sys.stdout.write(str(port) + "\n")
    sys.stdout.flush()
    server.serve_forever()


if __name__ == "__main__":
    main()

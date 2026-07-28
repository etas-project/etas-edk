module std_requirements.http.positive.http_wire_request_shape.main;

import std.codec.text.utf8_encode;
import std.http.codec.{HttpHeader, HttpWireRequest};

flow main(args: Array<string>) -> i32 ![] {
    let headers: List<HttpHeader> = [];
    let body = utf8_encode("payload");
    let request_headers = headers
        .push(HttpHeader { name = "host", value = "example.com" })
        .push(HttpHeader { name = "connection", value = "close" });
    let request = HttpWireRequest {
        method = "GET",
        target = "/status",
        version = "HTTP/1.1",
        headers = request_headers,
        body = body,
    };
    if request.version != "HTTP/1.1" { return 1; }
    if request.target != "/status" { return 1; }
    return 0;
}

module std_requirements.http.positive.http_response_body_text_decode.main;

import std.codec.text.{Replace, utf8_decode, utf8_encode};
import std.http.codec.{HttpHeader, HttpWireResponse, HttpWireResponseHead};

flow main(args: Array<string>) -> i32 ![] {
    let headers: List<HttpHeader> = [];
    let response = HttpWireResponse {
        head = HttpWireResponseHead {
            version = "HTTP/1.1",
            status = 200,
            reason = "OK",
            headers = headers,
        },
        body = utf8_encode("payload"),
    };
    let body = match utf8_decode(response.body, Replace) {
        Ok(text) => text,
        Err(_) => "",
    };
    if body != "payload" { return 1; }
    return 0;
}

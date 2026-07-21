module edk.http.wire.lower_request;

import std.http.codec.{HttpHeader, HttpWireRequest};
import std.text.{join, to_string_i32, to_string_usize};
import edk.http.headers.build.{header_name, header_text_value, is_managed_header_name, user_header_name_value};
import edk.http.pure.method.http_method_value;
import edk.http.types.{EncodedRequest, Headers, HttpRequest, Url};

public flow lower_request(request: HttpRequest) -> EncodedRequest ![] {
    return EncodedRequest {
        method = request.method,
        target = request.url.path_and_query,
        headers = request.headers,
        body = request.body,
        body_limit = request.body_limit,
        retry = request.retry,
    };
}

public flow encode_request(request: HttpRequest) -> EncodedRequest ![] {
    return lower_request(request);
}

flow default_scheme_port(scheme: string) -> i32 ![] {
    if scheme == "http" {
        return 80;
    }
    return 443;
}

flow authority_host(url: Url) -> string ![] {
    if url.port == default_scheme_port(url.scheme) {
        return url.host;
    }
    return join([url.host, ":", to_string_i32(url.port)], "");
}

flow lower_wire_headers(headers: Headers, url: Url, body_length: usize) -> List<HttpHeader> ![] {
    var out: List<HttpHeader> = [];
    out = out.push(HttpHeader { name = "host", value = authority_host(url) });
    out = out.push(HttpHeader { name = "connection", value = "close" });
    if body_length > 0 {
        out = out.push(HttpHeader { name = "content-length", value = to_string_usize(body_length) });
    }
    for header in headers.entries limit Iterations(65536) {
        let name = user_header_name_value(header_name(header));
        if !is_managed_header_name(name) {
            out = out.push(HttpHeader {
                name = name,
                value = header_text_value(header),
            });
        }
    }
    return out;
}

public flow lower_wire_request(request: HttpRequest) -> HttpWireRequest ![] {
    return HttpWireRequest {
        method = http_method_value(request.method),
        target = request.url.path_and_query,
        version = "HTTP/1.1",
        headers = lower_wire_headers(request.headers, request.url, request.body.length_bytes),
        body = request.body.raw,
    };
}

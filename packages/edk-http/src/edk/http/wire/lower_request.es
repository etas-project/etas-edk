module edk.http.wire.lower_request;

import std.bytes.len as bytes_len;
import std.http.codec.{HttpHeader, HttpWireRequest};
import std.text.{join, lowercase, to_string_i32, to_string_usize, trim};
import edk.http.headers.build.{header_name, header_text_value, is_managed_header_name, user_header_name_value};
import edk.http.headers.validate.is_valid_media_type;
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

flow should_emit_content_length(method: string, body_length: usize) -> bool ![] {
    if body_length > 0 {
        return true;
    }
    let normalized = lowercase(trim(method));
    return normalized == "post" || normalized == "put" || normalized == "patch";
}

flow lower_wire_headers(headers: Headers, url: Url, method: string, body_length: usize, media_type: string) -> List<HttpHeader> ![] {
    var out: List<HttpHeader> = [];
    out = out.push(HttpHeader { name = "host", value = authority_host(url) });
    out = out.push(HttpHeader { name = "connection", value = "close" });
    if should_emit_content_length(method, body_length) {
        out = out.push(HttpHeader { name = "content-length", value = to_string_usize(body_length) });
    }
    var has_content_type = false;
    for header in headers.entries limit Iterations(65536) {
        let name = user_header_name_value(header_name(header));
        let normalized = lowercase(trim(name));
        if normalized == "content-type" {
            let value = header_text_value(header);
            if !has_content_type && value != "" && is_valid_media_type(value) {
                out = out.push(HttpHeader {
                    name = name,
                    value = trim(value),
                });
                has_content_type = true;
            }
        } else if !is_managed_header_name(name) {
            out = out.push(HttpHeader {
                name = name,
                value = header_text_value(header),
            });
        }
    }
    if !has_content_type && trim(media_type) != "" && is_valid_media_type(media_type) {
        out = out.push(HttpHeader { name = "content-type", value = trim(media_type) });
    }
    return out;
}

public flow lower_wire_request(request: HttpRequest) -> HttpWireRequest ![] {
    let method = http_method_value(request.method);
    let body_length = bytes_len(request.body.raw);
    return HttpWireRequest {
        method = method,
        target = request.url.path_and_query,
        version = "HTTP/1.1",
        headers = lower_wire_headers(request.headers, request.url, method, body_length, request.body.media_type),
        body = request.body.raw,
    };
}

module edk.http.wire.decode_response;

import std.codec.text.{InvalidUtf8, Replace, Strict, utf8_decode, utf8_encode};
import std.http.codec.{HttpHeader, HttpWireResponse, HttpWireResponseHead};
import edk.http.errors.{HttpError, codec_error};
import edk.http.pure.status.is_valid_status;
import edk.http.types.{DecodedResponse, HttpResponse, ResponseBody, ResponseHeader, ResponseHeaders};

flow raise_http_error(error: HttpError) -> never ![Error<HttpError>]
{
    return perform Error<HttpError>.raise(error);
}

flow response_body(media_type: string, body: string) -> ResponseBody ![] {
    return ResponseBody {
        media_type = media_type,
        raw = utf8_encode(body),
        text = body,
    };
}

flow raw_response_body(media_type: string, raw: bytes) -> ResponseBody ![] {
    let decoded = match utf8_decode(raw, Replace) {
        Ok(text) => text,
        Err(_) => "",
    };
    return ResponseBody {
        media_type = media_type,
        raw = raw,
        text = decoded,
    };
}

flow strict_response_body(media_type: string, raw: bytes) -> Result<ResponseBody, HttpError> ![]
{
    return match utf8_decode(raw, Strict) {
        Ok(text) => Ok(ResponseBody {
            media_type = media_type,
            raw = raw,
            text = text,
        }),
        Err(InvalidUtf8) => Err(codec_error("HTTP response body is not valid UTF-8")),
        Err(_) => Err(codec_error("HTTP response body text decoding failed")),
    };
}

flow response_headers(head: HttpWireResponseHead) -> ResponseHeaders ![] {
    var entries: Array<ResponseHeader> = [];
    for header in head.headers limit Iterations(65536) {
        entries = entries.push(ResponseHeader {
            name = header.name,
            value = header.value,
        });
    }
    return ResponseHeaders { entries = entries };
}

flow response_media_type(headers: ResponseHeaders) -> string ![] {
    for header in headers.entries limit Iterations(65536) {
        if header.name == "content-type" {
            return header.value;
        }
    }
    return "application/octet-stream";
}

public flow http_response_from_wire_head(head: HttpWireResponseHead, media_type: string, body: string) -> HttpResponse ![] {
    return HttpResponse {
        status = head.status,
        headers = response_headers(head),
        body = response_body(media_type, body),
    };
}

public flow http_response_from_wire(response: HttpWireResponse, body: string) -> HttpResponse ![] {
    let headers = response_headers(response.head);
    return HttpResponse {
        status = response.head.status,
        headers = headers,
        body = response_body(response_media_type(headers), body),
    };
}

public flow http_response_from_wire_bytes(response: HttpWireResponse) -> HttpResponse ![] {
    let headers = response_headers(response.head);
    return HttpResponse {
        status = response.head.status,
        headers = headers,
        body = raw_response_body(response_media_type(headers), response.body),
    };
}

public flow http_response_from_wire_bytes_checked(response: HttpWireResponse) -> Result<HttpResponse, HttpError> ![] {
    let headers = response_headers(response.head);
    return match strict_response_body(response_media_type(headers), response.body) {
        Ok(body) => Ok(HttpResponse {
            status = response.head.status,
            headers = headers,
            body = body,
        }),
        Err(error) => Err(error),
    };
}

public flow decode_response(status: i32, media_type: string, body: string) -> DecodedResponse ![] {
    let headers: List<HttpHeader> = [];
    let response = http_response_from_wire_head(
        HttpWireResponseHead { version = "HTTP/1.1", status = status, reason = "", headers = headers },
        media_type,
        body,
    );
    if !is_valid_status(status) {
        return DecodedResponse {
            ok = false,
            response = response,
            message = "invalid status",
        };
    }
    return DecodedResponse {
        ok = true,
        response = response,
        message = "",
    };
}

public flow response_from_text(status: i32, media_type: string, body: string) -> DecodedResponse ![] {
    return decode_response(status, media_type, body);
}

public flow response_from_wire_head(head: HttpWireResponseHead, media_type: string, body: string) -> DecodedResponse ![] {
    let response = http_response_from_wire_head(head, media_type, body);
    if !is_valid_status(head.status) {
        return DecodedResponse {
            ok = false,
            response = response,
            message = "invalid status",
        };
    }
    return DecodedResponse {
        ok = true,
        response = response,
        message = "",
    };
}

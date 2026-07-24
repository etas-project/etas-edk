module edk.http.action_payload;

import std.codec.text.{Replace, utf8_decode};
import edk.http.pure.method.http_method_value;
import edk.http.policy.{HttpActionHeader, HttpActionRequest, HttpActionResponse};
import edk.http.types.{BodyLimit, HeaderSpec, Headers, HttpRequest, HttpResponse, RedirectPolicy, RequestBody, ResponseBody, ResponseHeader, ResponseHeaders, RetryPolicy, Timeout, Url, UserHeaderName, header_value_evidence, http_method_evidence, user_header_name_evidence};

flow lossy_text(raw: bytes) -> string ![] {
    return match utf8_decode(raw, Replace) {
        Ok(value) => value,
        Err(_) => "",
    };
}

flow lower_headers(headers: Headers) -> Array<HttpActionHeader> ![] {
    var entries: Array<HttpActionHeader> = [];
    for header in headers.entries limit Iterations(65536) {
        entries = entries.push(HttpActionHeader {
            name = header.name.value,
            value = header.value.value,
        });
    }
    return entries;
}

flow raise_headers(headers: Array<HttpActionHeader>) -> Headers ![] {
    var entries: Array<HeaderSpec<UserHeaderName>> = [];
    for header in headers limit Iterations(65536) {
        entries = entries.push(HeaderSpec<UserHeaderName> {
            name = user_header_name_evidence(header.name),
            value = header_value_evidence(header.value),
        });
    }
    return Headers { entries = entries };
}

flow lower_response_headers(headers: ResponseHeaders) -> Array<HttpActionHeader> ![] {
    var entries: Array<HttpActionHeader> = [];
    for header in headers.entries limit Iterations(65536) {
        entries = entries.push(HttpActionHeader {
            name = header.name,
            value = header.value,
        });
    }
    return entries;
}

flow raise_response_headers(headers: Array<HttpActionHeader>) -> ResponseHeaders ![] {
    var entries: Array<ResponseHeader> = [];
    for header in headers limit Iterations(65536) {
        entries = entries.push(ResponseHeader {
            name = header.name,
            value = header.value,
        });
    }
    return ResponseHeaders { entries = entries };
}

public flow lower_request(request: HttpRequest) -> HttpActionRequest ![] {
    return HttpActionRequest {
        method = http_method_value(request.method),
        scheme = request.url.scheme,
        host = request.url.host,
        port = request.url.port,
        path_and_query = request.url.path_and_query,
        headers = lower_headers(request.headers),
        body_media_type = request.body.media_type,
        body_raw = request.body.raw,
        body_text = request.body.text,
        body_length_bytes = request.body.length_bytes,
        timeout_millis = request.timeout.millis,
        body_limit_max_bytes = request.body_limit.max_bytes,
        retry_max_attempts = request.retry.max_attempts,
        retry_backoff_millis = request.retry.backoff_millis,
        redirect_follow = request.redirect.follow,
        redirect_max_hops = request.redirect.max_hops,
    };
}

public flow raise_request(request: HttpActionRequest) -> HttpRequest ![] {
    return HttpRequest {
        method = http_method_evidence(request.method),
        url = Url {
            scheme = request.scheme,
            host = request.host,
            port = request.port,
            path_and_query = request.path_and_query,
        },
        headers = raise_headers(request.headers),
        body = RequestBody {
            media_type = request.body_media_type,
            raw = request.body_raw,
            text = request.body_text,
            length_bytes = request.body_length_bytes,
        },
        timeout = Timeout { millis = request.timeout_millis },
        body_limit = BodyLimit { max_bytes = request.body_limit_max_bytes },
        retry = RetryPolicy {
            max_attempts = request.retry_max_attempts,
            backoff_millis = request.retry_backoff_millis,
        },
        redirect = RedirectPolicy {
            follow = request.redirect_follow,
            max_hops = request.redirect_max_hops,
        },
    };
}

public flow lower_response(response: HttpResponse) -> HttpActionResponse ![] {
    return HttpActionResponse {
        status = response.status,
        headers = lower_response_headers(response.headers),
        body_media_type = response.body.media_type,
        body_raw = response.body.raw,
        body_text = lossy_text(response.body.raw),
    };
}

public flow raise_response(response: HttpActionResponse) -> HttpResponse ![] {
    return HttpResponse {
        status = response.status,
        headers = raise_response_headers(response.headers),
        body = ResponseBody {
            media_type = response.body_media_type,
            raw = response.body_raw,
            text = lossy_text(response.body_raw),
        },
    };
}

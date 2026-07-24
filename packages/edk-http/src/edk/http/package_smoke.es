module edk.http.package_smoke;

import std.bytes.len as bytes_len;
import std.codec.text.utf8_encode;
import std.http.codec.{HttpHeader, HttpWireResponse, HttpWireResponseHead, encode_request as encode_wire_request};
import std.text.{lowercase, parse_i32, trim};
import edk.http.{delete as http_delete, get, head, patch, post, put};
import edk.http.action_payload.{lower_request as lower_action_request, lower_response as lower_action_response, raise_request as raise_action_request, raise_response as raise_action_response};
import edk.http.body.{bytes, decode_text_lossy, decode_text_strict, response_bytes, response_text as body_response_text, text};
import edk.http.client.new;
import edk.http.client.defaults.{apply_client_config, default_config, default_options, default_request, no_redirects, normalize_request, request_with_body_options, request_with_options, timeout_millis, with_body_limit, with_checked_header, with_redirect_policy, with_timeout};
import edk.http.errors.{HttpError, codec_error, network_transport_error, response_body_limit_error, response_body_read_error, stream_transport_error, tls_transport_error};
import edk.http.headers.{can_user_set_header, count, find, find_response, is_managed_header_name, is_valid_header_name, is_valid_header_value, set, single_checked};
import edk.http.handlers.preflight.preflight_request;
import edk.http.mocks.routes.{match_route, route};
import edk.http.mocks.server.response as mock_response;
import edk.http.pure.method.{delete_method, get_method, head_method, http_method_value, is_supported_method, patch_method, post_method, put_method};
import edk.http.pure.ssrf.is_ssrf_risk_host;
import edk.http.pure.status.{is_client_error_status, is_redirect_status, is_success_status};
import edk.http.url.{https, is_private_or_reserved_host, is_valid_host, is_valid_path_and_query, is_valid_port, normalize_path, parse_public_url};
import edk.http.url.parse.parse_url;
import edk.http.url.scope.request_scope;
import edk.http.policy.HttpActionResponse;
import edk.http.transport.execute_request;
import edk.http.types.{BodyLimit, Header, HeaderSpec, Headers, HttpClientConfig, HttpMethod, HttpRequest, HttpResponse, PublicHttpUrl, RedirectPolicy, RequestBody, RequestOptions, ResponseBody, ResponseHeader, ResponseHeaders, RetryPolicy, Timeout, Url, UserHeaderName, header_value_evidence, http_method_evidence, user_header_name_evidence};
import edk.http.wire.body_limit.is_request_body_within_limit;
import edk.http.wire.decode_response.{http_response_from_wire_bytes, http_response_from_wire_head, response_from_text, response_from_wire_head};
import edk.http.wire.lower_request.{encode_request, lower_wire_request};

flow count_wire_header(headers: List<HttpHeader>, name: string) -> i32 ![] {
    var total = 0;
    for item in headers limit Iterations(65536) {
        if item.name == name {
            total = total + 1;
        }
    }
    return total;
}

flow count_wire_header_ci(headers: List<HttpHeader>, name: string) -> i32 ![] {
    let wanted = lowercase(trim(name));
    var total = 0;
    for item in headers limit Iterations(65536) {
        if lowercase(trim(item.name)) == wanted {
            total = total + 1;
        }
    }
    return total;
}

flow wire_header_value_ci(headers: List<HttpHeader>, name: string) -> string ![] {
    let wanted = lowercase(trim(name));
    for item in headers limit Iterations(65536) {
        if lowercase(trim(item.name)) == wanted {
            return item.value;
        }
    }
    return "";
}

flow must_headers(result: Result<Headers, HttpError>) -> Headers ![Error<HttpError>] {
    match result {
        Ok(headers) => {
            return headers;
        }
        Err(error) => {
            return perform Error<HttpError>.raise(error);
        }
    }
}

flow trusted_header(name: string, value: string) -> Header ![] {
    return HeaderSpec<UserHeaderName> {
        name = user_header_name_evidence(name),
        value = header_value_evidence(value),
    };
}

flow must_request(result: Result<HttpRequest, HttpError>) -> HttpRequest ![Error<HttpError>] {
    match result {
        Ok(request) => {
            return request;
        }
        Err(error) => {
            return perform Error<HttpError>.raise(error);
        }
    }
}

flow must_url(result: Result<PublicHttpUrl, HttpError>) -> PublicHttpUrl ![Error<HttpError>] {
    match result {
        Ok(url) => {
            return url;
        }
        Err(error) => {
            return perform Error<HttpError>.raise(error);
        }
    }
}

flow raw_method(value: string) -> HttpMethod ![] {
    return http_method_evidence(value);
}

flow raw_default_request(method: HttpMethod, url: Url) -> HttpRequest ![] {
    let config = default_config();
    let entries: Array<Header> = [];
    return HttpRequest {
        method = method,
        url = url,
        headers = Headers { entries = entries },
        body = text("text/plain", ""),
        timeout = config.timeout,
        body_limit = config.body_limit,
        retry = config.retry,
        redirect = config.redirect,
    };
}

flow request_error_kind(result: Result<HttpRequest, HttpError>) -> string ![] {
    match result {
        Ok(request) => {
            return "";
        }
        Err(error) => {
            return error.kind;
        }
    }
}

flow check_error_mappings() -> i32 ![] {
    let codec = codec_error("decode failed");
    let network = network_transport_error("TCP connect failed");
    let tls = tls_transport_error("TLS handshake failed");
    let stream = stream_transport_error("stream read failed");
    let response_read = response_body_read_error("response body read failed");
    let response_limit = response_body_limit_error("response body exceeded configured body limit");
    let bad_status = codec_error("HTTP response status is invalid");

    if codec.kind != "codec" { return 1; }
    if codec.message != "decode failed" { return 1; }
    if network.kind != "network" { return 1; }
    if network.message != "TCP connect failed" { return 1; }
    if tls.kind != "tls" { return 1; }
    if tls.message != "TLS handshake failed" { return 1; }
    if stream.kind != "stream" { return 1; }
    if stream.message != "stream read failed" { return 1; }
    if response_read.kind != "response_body_read" { return 1; }
    if response_read.message != "response body read failed" { return 1; }
    if response_limit.kind != "response_body_limit" { return 1; }
    if response_limit.message != "response body exceeded configured body limit" { return 1; }
    if bad_status.kind != "codec" { return 1; }
    if bad_status.message != "HTTP response status is invalid" { return 1; }
    return 0;
}

flow check_preflight_scope_and_url(request: HttpRequest) -> i32 ![] {
    let bad_preflight_method = preflight_request(post_method(), request.url.host, request);
    let bad_preflight_host = preflight_request(request.method, "api.example.com", request);
    let bad_method = HttpRequest {
        method = raw_method("TRACE"),
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_url = HttpRequest {
        method = request.method,
        url = Url { scheme = "ftp", host = "example.com", port = 21, path_and_query = "/v1/items" },
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_path = HttpRequest {
        method = request.method,
        url = Url { scheme = "https", host = "example.com", port = 443, path_and_query = "/v1/items#section" },
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_port = HttpRequest {
        method = request.method,
        url = Url { scheme = "https", host = "example.com", port = 0, path_and_query = "/v1/items" },
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };

    if preflight_request(request.method, request.url.host, request).ok == false { return 1; }
    if bad_preflight_method.error.kind != "invalid_request" { return 1; }
    if bad_preflight_host.error.kind != "invalid_request" { return 1; }
    if preflight_request(raw_method("TRACE"), request.url.host, bad_method).error.kind != "invalid_method" { return 1; }
    if preflight_request(request.method, "example.com", bad_url).error.kind != "invalid_url" { return 1; }
    if preflight_request(request.method, "example.com", bad_path).error.kind != "invalid_url" { return 1; }
    if preflight_request(request.method, "example.com", bad_port).error.kind != "invalid_url" { return 1; }
    return 0;
}

flow check_preflight_local_and_body(request: HttpRequest) -> i32 ![] {
    let private_host = HttpRequest {
        method = request.method,
        url = Url { scheme = "https", host = "127.0.0.1", port = 443, path_and_query = "/v1/items" },
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_body_limit = HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = BodyLimit { max_bytes = 0 },
        retry = request.retry,
        redirect = request.redirect,
    };
    let body_too_large = HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = text("text/plain", "too-large"),
        timeout = request.timeout,
        body_limit = BodyLimit { max_bytes = 3 },
        retry = request.retry,
        redirect = request.redirect,
    };
    if !preflight_request(request.method, "127.0.0.1", private_host).ok { return 1; }
    if !is_ssrf_risk_host(private_host.url.host) { return 1; }
    if preflight_request(request.method, request.url.host, bad_body_limit).error.kind != "body_limit" { return 1; }
    if preflight_request(request.method, request.url.host, body_too_large).error.kind != "body_limit" { return 1; }
    return 0;
}

flow check_preflight_options(request: HttpRequest) -> i32 ![] {
    let bad_timeout = HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = Timeout { millis = 0 },
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_redirect = HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = RedirectPolicy { follow = true, max_hops = -1 },
    };
    let bad_retry_attempts = HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = RetryPolicy { max_attempts = 0, backoff_millis = 0 },
        redirect = request.redirect,
    };
    let bad_retry_backoff = HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = RetryPolicy { max_attempts = 1, backoff_millis = -1 },
        redirect = request.redirect,
    };

    if preflight_request(request.method, request.url.host, bad_timeout).error.kind != "timeout" { return 1; }
    if preflight_request(request.method, request.url.host, bad_redirect).error.kind != "redirect" { return 1; }
    if preflight_request(request.method, request.url.host, bad_retry_attempts).error.kind != "retry" { return 1; }
    if preflight_request(request.method, request.url.host, bad_retry_backoff).error.kind != "retry" { return 1; }
    return 0;
}

flow check_preflight_rejections(request: HttpRequest) -> i32 ![] {
    if check_preflight_scope_and_url(request) != 0 { return 1; }
    if check_preflight_local_and_body(request) != 0 { return 1; }
    if check_preflight_options(request) != 0 { return 1; }
    return 0;
}

flow check_public_preflight_error_kind(request: HttpRequest, expected: string) -> i32 ![] {
    let observed = preflight_request(request.method, request.url.host, request);
    if observed.ok { return 1; }
    if observed.error.kind != expected { return 1; }
    return 0;
}

flow check_public_url_string_error_kind(url: string, expected: string) -> i32 ![] {
    return match parse_public_url(url) {
        Ok(_) => 1,
        Err(err) => {
            if err.kind != expected { return 1; }
            return 0;
        },
    };
}

flow check_connection_header_contract(args: Array<string>) -> i32 ![Error<HttpError>] {
    let target = must_url(https("example.com", "/v1/items"));
    let base = default_request(get_method(), target);
    let attempted = with_checked_header(base, "Connection", "keep-alive");
    let wire = lower_wire_request(HttpRequest {
        method = get_method(),
        url = target,
        headers = Headers {
            entries = [
                trusted_header("Connection", "keep-alive"),
                trusted_header("Accept", "text/plain"),
            ],
        },
        body = base.body,
        timeout = base.timeout,
        body_limit = base.body_limit,
        retry = base.retry,
        redirect = base.redirect,
    });

    if can_user_set_header("Connection", "keep-alive") { return 1; }
    if !is_managed_header_name("CONNECTION") { return 1; }
    if request_error_kind(attempted) != "managed_header" { return 1; }
    if count_wire_header(wire.headers, "connection") != 1 { return 1; }
    if count_wire_header(wire.headers, "Connection") != 0 { return 1; }
    if count_wire_header(wire.headers, "Accept") != 1 { return 1; }
    return 0;
}

flow check_public_preflight_error_contract(args: Array<string>) -> i32 ![Error<HttpError>] {
    return check_public_preflight_error_kind(
        default_request(raw_method("TRACE"), must_url(https("example.com", "/v1/items"))),
        "invalid_method",
    );
}

flow check_public_invalid_url_error_contract(args: Array<string>) -> i32 ![] {
    return check_public_preflight_error_kind(
        raw_default_request(get_method(), Url { scheme = "ftp", host = "example.com", port = 21, path_and_query = "/v1/items" }),
        "invalid_url",
    );
}

flow check_public_invalid_url_string_error_contract(args: Array<string>) -> i32 ![] {
    return check_public_url_string_error_kind("ftp://example.com/v1/items", "invalid_url");
}

flow check_public_body_limit_error_contract(args: Array<string>) -> i32 ![Error<HttpError>] {
    let base = default_request(post_method(), must_url(https("example.com", "/v1/items")));
    let request = HttpRequest {
        method = base.method,
        url = base.url,
        headers = base.headers,
        body = text("text/plain", "too-large"),
        timeout = base.timeout,
        body_limit = BodyLimit { max_bytes = 3 },
        retry = base.retry,
        redirect = base.redirect,
    };
    return check_public_preflight_error_kind(request, "body_limit");
}

flow loopback_request(port: string, path: string) -> HttpRequest ![Error<HttpError>] {
    let parsed_port = match parse_i32(port) {
        Ok(value) => value,
        Err(_) => {
            return perform Error<HttpError>.raise(HttpError { kind = "invalid_url", message = "invalid loopback port" });
        }
    };
    return raw_default_request(
        get_method(),
        Url { scheme = "http", host = "127.0.0.1", port = parsed_port, path_and_query = path },
    );
}

flow loopback_request_with_body(port: string, path: string, body: RequestBody) -> HttpRequest ![Error<HttpError>] {
    let base = loopback_request(port, path);
    return HttpRequest {
        method = post_method(),
        url = base.url,
        headers = base.headers,
        body = body,
        timeout = base.timeout,
        body_limit = base.body_limit,
        retry = base.retry,
        redirect = base.redirect,
    };
}

flow loopback_limit_options() -> RequestOptions ![] {
    let base = default_options();
    return RequestOptions {
        timeout = base.timeout,
        body_limit = BodyLimit { max_bytes = 32 },
        retry = base.retry,
        redirect = base.redirect,
    };
}

flow loopback_get_error_kind(request: HttpRequest) -> string ![] {
    return handle {
        let response = execute_request(request.method, request.url.host, request);
        "unexpected"
    } with {
        Error<HttpError>.raise(err) => {
            finish err.kind;
        }
    };
}

flow check_loopback_runtime_contract(args: Array<string>) -> i32 ![Error<IndexError>, Error<HttpError>] {
    let port = args[0];
    let hello_check = handle {
        var failed = 0;
        let hello_request = loopback_request(port, "/hello");
        let hello = execute_request(hello_request.method, hello_request.url.host, hello_request);
        if hello.status != 200 { failed = 1; }
        if hello.body.text != "hello" { failed = 1; }
        let marker = find_response(hello.headers, "x-edk-loopback");
        if !marker.found { failed = 1; }
        if marker.value != "yes" { failed = 1; }
        failed
    } with {
        Error<HttpError>.raise(err) => {
            finish 1;
        }
    };
    if hello_check != 0 { return 1; }

    let post_check = handle {
        var failed = 0;
        let echo_request = loopback_request_with_body(port, "/echo", text("text/plain", "payload"));
        let echoed = execute_request(echo_request.method, echo_request.url.host, echo_request);
        if echoed.status != 200 { failed = 1; }
        if echoed.body.text != "POST:payload" { failed = 1; }
        failed
    } with {
        Error<HttpError>.raise(err) => {
            finish 1;
        }
    };
    if post_check != 0 { return 1; }

    let limit_base = loopback_request(port, "/large");
    let limit_options = loopback_limit_options();
    let limit_request = HttpRequest {
        method = limit_base.method,
        url = limit_base.url,
        headers = limit_base.headers,
        body = limit_base.body,
        timeout = limit_options.timeout,
        body_limit = limit_options.body_limit,
        retry = limit_options.retry,
        redirect = limit_options.redirect,
    };
    let limit_kind = loopback_get_error_kind(limit_request);
    if limit_kind != "response_body_limit" { return 1; }
    let malformed_kind = loopback_get_error_kind(loopback_request(port, "/malformed"));
    if malformed_kind != "codec" { return 1; }
    return 0;
}

flow request_with_body(method: HttpMethod, target: PublicHttpUrl, body: RequestBody) -> HttpRequest ![] {
    let base = default_request(method, target);
    return HttpRequest {
        method = method,
        url = target,
        headers = base.headers,
        body = body,
        timeout = base.timeout,
        body_limit = base.body_limit,
        retry = base.retry,
        redirect = base.redirect,
    };
}

flow request_with_headers_and_body(method: HttpMethod, target: PublicHttpUrl, headers: Headers, body: RequestBody) -> HttpRequest ![] {
    let base = request_with_body(method, target, body);
    return HttpRequest {
        method = base.method,
        url = base.url,
        headers = headers,
        body = base.body,
        timeout = base.timeout,
        body_limit = base.body_limit,
        retry = base.retry,
        redirect = base.redirect,
    };
}

// Phase 1 contracts are pure unless explicitly named as loopback targets.
flow check_phase1_request_lengths_target(args: Array<string>) -> i32 ![Error<HttpError>] {
    let target = must_url(https("example.com", "/length"));
    let ascii = text("text/plain", "hello");
    let chinese = text("text/plain; charset=utf-8", "你好");
    let emoji = text("text/plain; charset=utf-8", "😀");
    let binary = bytes("application/octet-stream", utf8_encode("abc"));

    if ascii.length_bytes != 5 { return 1; }
    if chinese.length_bytes != 6 { return 1; }
    if emoji.length_bytes != 4 { return 1; }
    if binary.length_bytes != 3 { return 1; }
    if bytes_len(chinese.raw) != 6 { return 1; }
    if bytes_len(emoji.raw) != 4 { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(post_method(), target, ascii)).headers, "content-length") != "5" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(post_method(), target, chinese)).headers, "content-length") != "6" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(post_method(), target, emoji)).headers, "content-length") != "4" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(post_method(), target, binary)).headers, "content-length") != "3" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(get_method(), target, ascii)).headers, "content-length") != "5" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(head_method(), target, ascii)).headers, "content-length") != "5" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(delete_method(), target, ascii)).headers, "content-length") != "5" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(put_method(), target, ascii)).headers, "content-length") != "5" { return 1; }
    if wire_header_value_ci(lower_wire_request(request_with_body(patch_method(), target, ascii)).headers, "content-length") != "5" { return 1; }
    return 0;
}

flow check_phase1_forged_length_target(args: Array<string>) -> i32 ![Error<HttpError>] {
    let target = must_url(https("example.com", "/forged-length"));
    let base = request_with_body(post_method(), target, RequestBody {
        media_type = "text/plain",
        raw = utf8_encode("hello"),
        text = "hello",
        length_bytes = 0,
    });
    let limited = HttpRequest {
        method = base.method,
        url = base.url,
        headers = base.headers,
        body = base.body,
        timeout = base.timeout,
        body_limit = BodyLimit { max_bytes = 4 },
        retry = base.retry,
        redirect = base.redirect,
    };
    let round_trip = raise_action_request(lower_action_request(base));
    if wire_header_value_ci(lower_wire_request(base).headers, "content-length") != "5" { return 1; }
    if preflight_request(limited.method, limited.url.host, limited).error.kind != "body_limit" { return 1; }
    if round_trip.body.length_bytes != 0 { return 1; }
    if wire_header_value_ci(lower_wire_request(round_trip).headers, "content-length") != "5" { return 1; }
    return 0;
}

flow check_phase1_empty_content_length_target(args: Array<string>) -> i32 ![Error<HttpError>] {
    let target = must_url(https("example.com", "/empty"));
    let empty_body = text("", "");
    let get_wire = lower_wire_request(request_with_body(get_method(), target, empty_body));
    let head_wire = lower_wire_request(request_with_body(head_method(), target, empty_body));
    let delete_wire = lower_wire_request(request_with_body(delete_method(), target, empty_body));
    let post_wire = lower_wire_request(request_with_body(post_method(), target, empty_body));
    let put_wire = lower_wire_request(request_with_body(put_method(), target, empty_body));
    let patch_wire = lower_wire_request(request_with_body(patch_method(), target, empty_body));
    if count_wire_header_ci(get_wire.headers, "content-length") != 0 { return 1; }
    if count_wire_header_ci(head_wire.headers, "content-length") != 0 { return 1; }
    if count_wire_header_ci(delete_wire.headers, "content-length") != 0 { return 1; }
    if wire_header_value_ci(post_wire.headers, "content-length") != "0" { return 1; }
    if wire_header_value_ci(put_wire.headers, "content-length") != "0" { return 1; }
    if wire_header_value_ci(patch_wire.headers, "content-length") != "0" { return 1; }
    return 0;
}

flow check_phase1_content_type_target(args: Array<string>) -> i32 ![Error<HttpError>] {
    let target = must_url(https("example.com", "/content-type"));
    let automatic = lower_wire_request(request_with_body(post_method(), target, text("application/json", "{}")));
    let typed_empty = lower_wire_request(request_with_body(post_method(), target, text("application/json", "")));
    let explicit_headers = Headers { entries = [trusted_header("Content-Type", "application/problem+json")] };
    let explicit = lower_wire_request(request_with_headers_and_body(post_method(), target, explicit_headers, text("application/json", "{}")));
    let forged_headers = Headers {
        entries = [
            trusted_header("Content-Type", "application/json"),
            trusted_header("content-type", "text/plain"),
        ],
    };
    let forged = request_with_headers_and_body(post_method(), target, forged_headers, text("application/xml", "<x/>"));
    let unsafe = request_with_body(post_method(), target, text("text/plain\r\nX-Injected: yes", "x"));
    let unsafe_control = request_with_body(post_method(), target, text("text/plain\tevil", "x"));
    let unsafe_nul = request_with_body(post_method(), target, text("text/plain\0evil", "x"));
    let blank = request_with_body(post_method(), target, text("   ", "x"));
    let mixed = Headers { entries = [trusted_header("X-Custom", "first")] };
    let mixed_replaced = set(mixed, trusted_header("x-custom", "second"));
    let mixed_lookup = find(mixed_replaced, "X-CUSTOM");

    if count_wire_header_ci(automatic.headers, "content-type") != 1 { return 1; }
    if wire_header_value_ci(automatic.headers, "content-type") != "application/json" { return 1; }
    if wire_header_value_ci(typed_empty.headers, "content-type") != "application/json" { return 1; }
    if count_wire_header_ci(explicit.headers, "content-type") != 1 { return 1; }
    if wire_header_value_ci(explicit.headers, "content-type") != "application/problem+json" { return 1; }
    if preflight_request(forged.method, forged.url.host, forged).error.kind != "invalid_header" { return 1; }
    if count_wire_header_ci(lower_wire_request(forged).headers, "content-type") != 1 { return 1; }
    if preflight_request(unsafe.method, unsafe.url.host, unsafe).error.kind != "invalid_header" { return 1; }
    if preflight_request(unsafe_control.method, unsafe_control.url.host, unsafe_control).error.kind != "invalid_header" { return 1; }
    if preflight_request(unsafe_nul.method, unsafe_nul.url.host, unsafe_nul).error.kind != "invalid_header" { return 1; }
    if preflight_request(blank.method, blank.url.host, blank).error.kind != "invalid_header" { return 1; }
    if count(mixed_replaced) != 1 { return 1; }
    if !mixed_lookup.found { return 1; }
    if mixed_lookup.value != "second" { return 1; }
    return 0;
}

flow check_phase1_response_compatibility_target(args: Array<string>) -> i32 ![] {
    let no_wire_headers: List<HttpHeader> = [];
    let mixed_case_headers = no_wire_headers.push(HttpHeader { name = "Content-Type", value = "text/plain" });
    let response = http_response_from_wire_bytes(HttpWireResponse {
        head = HttpWireResponseHead { version = "HTTP/1.1", status = 200, reason = "OK", headers = mixed_case_headers },
        body = utf8_encode("raw body"),
    });
    let supplied = HttpActionResponse {
        status = 206,
        headers = [],
        body_media_type = "text/plain",
        body_raw = utf8_encode("raw wins"),
        body_text = "forged text",
    };
    let raised = raise_action_response(supplied);
    let lowered = lower_action_response(HttpResponse {
        status = 200,
        headers = ResponseHeaders { entries = [ResponseHeader { name = "Content-Type", value = "text/plain" }] },
        body = ResponseBody { media_type = "text/plain", raw = utf8_encode("raw wins"), text = "forged text" },
    });
    let strict = decode_text_strict(ResponseBody {
        media_type = "text/plain",
        raw = utf8_encode("strict raw"),
        text = "forged text",
    });
    let lossy = decode_text_lossy(ResponseBody {
        media_type = "text/plain",
        raw = utf8_encode("lossy raw"),
        text = "forged text",
    });
    let strict_empty = decode_text_strict(ResponseBody {
        media_type = "text/plain",
        raw = utf8_encode(""),
        text = "forged text",
    });

    if response.body.media_type != "text/plain" { return 1; }
    if bytes_len(response.body.raw) != 8 { return 1; }
    if response.body.text != "raw body" { return 1; }
    if raised.body.text != "raw wins" { return 1; }
    if lowered.body_text != "raw wins" { return 1; }
    match strict {
        Ok(value) => {
            if value != "strict raw" { return 1; }
        }
        Err(_) => { return 1; }
    }
    match strict_empty {
        Ok(value) => {
            if value != "" { return 1; }
        }
        Err(_) => { return 1; }
    }
    if lossy != "lossy raw" { return 1; }
    return 0;
}

flow check_loopback_binary_response_target(args: Array<string>) -> i32 ![Error<IndexError>] {
    let port = args[0];
    return handle {
        let binary_get = loopback_request(port, "/binary");
        let response = execute_request(binary_get.method, binary_get.url.host, binary_get);
        if response.status != 200 { return 1; }
        if response.body.media_type != "application/octet-stream" { return 1; }
        if bytes_len(response.body.raw) != 3 { return 1; }
        let action_round_trip = raise_action_response(lower_action_response(response));
        if bytes_len(action_round_trip.body.raw) != 3 { return 1; }
        if action_round_trip.body.text != decode_text_lossy(action_round_trip.body) { return 1; }
        let binary_request = request_with_body(post_method(), must_url(https("example.com", "/binary-request")), bytes("application/octet-stream", response.body.raw));
        if wire_header_value_ci(lower_wire_request(binary_request).headers, "content-length") != "3" { return 1; }
        match decode_text_strict(response.body) {
            Ok(_) => { return 1; }
            Err(error) => {
                if error.kind != "codec" { return 1; }
            }
        }
        if decode_text_lossy(response.body) != response.body.text { return 1; }
        let nul_get = loopback_request(port, "/nul");
        let nul_response = execute_request(nul_get.method, nul_get.url.host, nul_get);
        if bytes_len(nul_response.body.raw) != 3 { return 1; }
        match decode_text_strict(nul_response.body) {
            Ok(value) => {
                if value != nul_response.body.text { return 1; }
            }
            Err(_) => { return 1; }
        }
        return 0;
    } with {
        Error<HttpError>.raise(err) => {
            finish 1;
        }
    };
}

flow check_url_and_header_smoke() -> i32 ![Error<HttpError>] {
    let target = must_url(https("Example.COM", "v1/items"));
    let req = with_redirect_policy(
        with_timeout(
            must_request(with_checked_header(default_request(get_method(), target), "Accept", "application/json")),
            timeout_millis(1000),
        ),
        no_redirects(),
    );
    let encoded = encode_request(req);
    let wire = lower_wire_request(req);
    let parsed = parse_url("https://Example.COM/v1/items");
    let parsed_query = parse_url("https://Example.COM?tag=edk");
    let parsed_path_query = parse_url("https://Example.COM/v1/items?tag=edk/a");
    let parsed_default_port = parse_url("https://example.com:443/v1/items");
    let parsed_custom_port = parse_url("https://example.com:8443/v1/items");
    let invalid_port_text = parse_url("https://example.com:abc/v1/items");
    let invalid_port_range = parse_url("https://example.com:70000/v1/items");
    let invalid_host = parse_url("https://bad host/v1/items");
    let private_host = parse_url("https://127.0.0.1/v1/items");
    let userinfo_host = parse_url("https://user@example.com/v1/items");
    let backslash_path = parse_url("https://example.com/api\\items");
    let newline_path = parse_url("https://example.com/api\nInjected: bad");
    let backslash_host = parse_url("https://example.com\\evil.test/archive");
    let repeated_dot_host = parse_url("https://example..com/archive");
    let leading_dot_host = parse_url("https://.example.com/archive");
    let trailing_dot_host = parse_url("https://example.com./archive");
    let leading_hyphen_host = parse_url("https://-example.com/archive");
    let trailing_hyphen_host = parse_url("https://example-.com/archive");
    let underscore_host = parse_url("https://api_example.com/archive");
    let fragment_path = parse_url("https://example.com/v1/items#section");
    let space_path = parse_url("https://example.com/v1 items");
    let headers = must_headers(single_checked("Content-Type", "application/json; charset=utf-8"));
    let content_type = find(headers, "content-type");
    let overwritten = must_request(with_checked_header(
        must_request(with_checked_header(default_request(get_method(), target), "Content-Type", "text/plain")),
        "content-type",
        "application/json",
    ));
    let overwritten_content_type = find(overwritten.headers, "Content-Type");
    let host_attempt = with_checked_header(req, "Host", "evil.example");
    let bad_header_attempt = with_checked_header(req, "Bad Header", "x");

    if req.url.host != "example.com" { return 1; }
    if req.url.path_and_query != "/v1/items" { return 1; }
    if encoded.target != "/v1/items" { return 1; }
    if wire.method != "GET" { return 1; }
    if wire.target != "/v1/items" { return 1; }
    if !parsed.ok { return 1; }
    if parsed.url.host != "example.com" { return 1; }
    if !parsed_query.ok { return 1; }
    if parsed_query.url.host != "example.com" { return 1; }
    if parsed_query.url.path_and_query != "/?tag=edk" { return 1; }
    if !parsed_path_query.ok { return 1; }
    if parsed_path_query.url.host != "example.com" { return 1; }
    if parsed_path_query.url.path_and_query != "/v1/items?tag=edk/a" { return 1; }
    if !parsed_default_port.ok { return 1; }
    if parsed_default_port.url.port != 443 { return 1; }
    if !parsed_custom_port.ok { return 1; }
    if parsed_custom_port.url.port != 8443 { return 1; }
    if invalid_port_text.ok { return 1; }
    if invalid_port_text.message != "invalid port" { return 1; }
    if invalid_port_range.ok { return 1; }
    if invalid_port_range.message != "invalid port" { return 1; }
    if invalid_host.ok { return 1; }
    if invalid_host.message != "invalid host" { return 1; }
    if !private_host.ok { return 1; }
    if private_host.url.host != "127.0.0.1" { return 1; }
    if !is_private_or_reserved_host(private_host.url.host) { return 1; }
    if !is_ssrf_risk_host(private_host.url.host) { return 1; }
    if userinfo_host.ok { return 1; }
    if userinfo_host.message != "invalid host" { return 1; }
    if backslash_path.ok { return 1; }
    if backslash_path.message != "invalid path" { return 1; }
    if newline_path.ok { return 1; }
    if newline_path.message != "invalid path" { return 1; }
    if backslash_host.ok { return 1; }
    if backslash_host.message != "invalid host" { return 1; }
    if repeated_dot_host.ok { return 1; }
    if repeated_dot_host.message != "invalid host" { return 1; }
    if leading_dot_host.ok { return 1; }
    if leading_dot_host.message != "invalid host" { return 1; }
    if trailing_dot_host.ok { return 1; }
    if trailing_dot_host.message != "invalid host" { return 1; }
    if leading_hyphen_host.ok { return 1; }
    if leading_hyphen_host.message != "invalid host" { return 1; }
    if trailing_hyphen_host.ok { return 1; }
    if trailing_hyphen_host.message != "invalid host" { return 1; }
    if underscore_host.ok { return 1; }
    if underscore_host.message != "invalid host" { return 1; }
    if fragment_path.ok { return 1; }
    if fragment_path.message != "invalid path" { return 1; }
    if space_path.ok { return 1; }
    if space_path.message != "invalid path" { return 1; }
    if !is_valid_host("example.com") { return 1; }
    if is_valid_host("bad host") { return 1; }
    if !is_valid_host("localhost") { return 1; }
    if !is_valid_host("127.0.0.1") { return 1; }
    if !is_valid_host("10.0.0.5") { return 1; }
    if !is_private_or_reserved_host("LOCALHOST") { return 1; }
    if is_valid_host("bad\thost") { return 1; }
    if is_valid_host("example..com") { return 1; }
    if is_valid_host(".example.com") { return 1; }
    if is_valid_host("example.com.") { return 1; }
    if is_valid_host("-example.com") { return 1; }
    if is_valid_host("example-.com") { return 1; }
    if is_valid_host("api_example.com") { return 1; }
    if is_valid_host("example.com?tag=edk") { return 1; }
    if is_valid_host("user@example.com") { return 1; }
    if is_valid_host("example.com:443") { return 1; }
    if !is_valid_port(443) { return 1; }
    if is_valid_port(0) { return 1; }
    if is_valid_port(70000) { return 1; }
    if normalize_path("health") != "/health" { return 1; }
    if !is_valid_path_and_query("/v1/items?tag=edk") { return 1; }
    if is_valid_path_and_query("/v1/items#section") { return 1; }
    if is_valid_path_and_query("/v1 items") { return 1; }
    if is_valid_path_and_query("/v1\titems") { return 1; }
    if !is_supported_method("get") { return 1; }
    if !is_supported_method("PATCH") { return 1; }
    if is_supported_method("trace") { return 1; }
    if count(req.headers) != 1 { return 1; }
    if !is_valid_header_name("Accept") { return 1; }
    if is_valid_header_name("Bad Header") { return 1; }
    if is_valid_header_name("Bad/Header") { return 1; }
    if is_valid_header_name("Bad@Header") { return 1; }
    if is_valid_header_name("Bad(Header)") { return 1; }
    if is_valid_header_name("Bad=Header") { return 1; }
    if is_valid_header_name("Bad\tHeader") { return 1; }
    if is_valid_header_name("Bad\nHeader") { return 1; }
    if !is_valid_header_value("application/json; charset=utf-8") { return 1; }
    if is_valid_header_value("ok\r\nInjected: bad") { return 1; }
    if !can_user_set_header("Content-Type", "application/json") { return 1; }
    if can_user_set_header("Host", "example.com") { return 1; }
    if can_user_set_header("Content-Length", "10") { return 1; }
    if can_user_set_header("Bad Header", "x") { return 1; }
    if !is_managed_header_name("Host") { return 1; }
    if !is_managed_header_name("content-length") { return 1; }
    if is_managed_header_name("Accept") { return 1; }
    if count(overwritten.headers) != 1 { return 1; }
    if !overwritten_content_type.found { return 1; }
    if overwritten_content_type.value != "application/json" { return 1; }
    if request_error_kind(host_attempt) != "managed_header" { return 1; }
    if request_error_kind(bad_header_attempt) != "invalid_header_name" { return 1; }
    if !content_type.found { return 1; }
    if content_type.value != "application/json; charset=utf-8" { return 1; }
    if req.timeout.millis != 1000 { return 1; }
    if req.redirect.follow { return 1; }
    return 0;
}

flow check_request_options_and_body_smoke() -> i32 ![Error<HttpError>] {
    let target = must_url(https("Example.COM", "v1/items"));
    let config = default_config();
    let options = default_options();
    let client = new(config);
    let custom_config = HttpClientConfig {
        timeout = Timeout { millis = 1234 },
        body_limit = BodyLimit { max_bytes = 4096 },
        retry = RetryPolicy { max_attempts = 3, backoff_millis = 250 },
        tls = config.tls,
        proxy = config.proxy,
        auth = config.auth,
        cookie = config.cookie,
        redirect = RedirectPolicy { follow = false, max_hops = 0 },
    };
    let configured_client = new(custom_config);
    let req = with_redirect_policy(
        with_timeout(
            must_request(with_checked_header(default_request(get_method(), target), "Accept", "application/json")),
            timeout_millis(1000),
        ),
        no_redirects(),
    );
    let configured_req = apply_client_config(configured_client, req);
    let caller_configured_req = normalize_request(HttpRequest {
        method = raw_method("post"),
        url = req.url,
        headers = req.headers,
        body = req.body,
        timeout = Timeout { millis = 1111 },
        body_limit = BodyLimit { max_bytes = 2222 },
        retry = RetryPolicy { max_attempts = 3, backoff_millis = 444 },
        redirect = RedirectPolicy { follow = false, max_hops = 0 },
    });
    let post_req = with_body_limit(default_request(post_method(), target), config.body_limit);
    let encoded = encode_request(req);
    let text_body = text("text/plain", "hello");
    let api_get_req = request_with_options(get_method(), target, options);
    let api_put_req = request_with_body_options(put_method(), target, text_body, options);
    let api_patch_req = request_with_body_options(patch_method(), target, text_body, options);
    let api_delete_req = request_with_options(delete_method(), target, options);
    let api_head_req = request_with_options(head_method(), target, options);
    let body_wire = lower_wire_request(api_put_req);
    let body_wire_encoded = match encode_wire_request(body_wire) {
        Ok(encoded_body_wire) => encoded_body_wire,
        Err(_) => {
            return 1;
        }
    };
    let manual_managed_header_req = HttpRequest {
        method = get_method(),
        url = target,
        headers = Headers {
            entries = [
                trusted_header("Host", "evil.example"),
                trusted_header("Content-Length", "999"),
                trusted_header("Accept", "text/plain"),
            ],
        },
        body = req.body,
        timeout = req.timeout,
        body_limit = req.body_limit,
        retry = req.retry,
        redirect = req.redirect,
    };
    let managed_wire = lower_wire_request(manual_managed_header_req);
    let text_body_limit_exact = BodyLimit { max_bytes = 5 };
    let text_body_limit_short = BodyLimit { max_bytes = 4 };
    let bytes_body = bytes("application/octet-stream", utf8_encode("hello"));
    let bytes_response = response_bytes("application/octet-stream", utf8_encode("hello"));
    let text_response_body = body_response_text("text/plain", "hello");

    if http_method_value(configured_req.method) != "GET" { return 1; }
    if configured_req.timeout.millis != 1234 { return 1; }
    if configured_req.body_limit.max_bytes != 4096 { return 1; }
    if configured_req.retry.max_attempts != 3 { return 1; }
    if configured_req.retry.backoff_millis != 250 { return 1; }
    if configured_req.redirect.follow { return 1; }
    if configured_req.redirect.max_hops != 0 { return 1; }
    if http_method_value(caller_configured_req.method) != "POST" { return 1; }
    if caller_configured_req.timeout.millis != 1111 { return 1; }
    if caller_configured_req.body_limit.max_bytes != 2222 { return 1; }
    if caller_configured_req.retry.max_attempts != 3 { return 1; }
    if caller_configured_req.retry.backoff_millis != 444 { return 1; }
    if caller_configured_req.redirect.follow { return 1; }
    if caller_configured_req.redirect.max_hops != 0 { return 1; }
    if http_method_value(api_get_req.method) != "GET" { return 1; }
    if http_method_value(api_put_req.method) != "PUT" { return 1; }
    if api_put_req.body.text != "hello" { return 1; }
    if count_wire_header(body_wire.headers, "content-length") != 1 { return 1; }
    if http_method_value(api_patch_req.method) != "PATCH" { return 1; }
    if http_method_value(api_delete_req.method) != "DELETE" { return 1; }
    if http_method_value(api_head_req.method) != "HEAD" { return 1; }
    if config.body_limit.max_bytes != 1048576 { return 1; }
    if post_req.body_limit.max_bytes != 1048576 { return 1; }
    if encoded.body_limit.max_bytes != 1048576 { return 1; }
    if encoded.retry.max_attempts != 1 { return 1; }
    if encoded.retry.backoff_millis != 0 { return 1; }
    if text_body.text != "hello" { return 1; }
    if !is_request_body_within_limit(text_body, text_body_limit_exact) { return 1; }
    if is_request_body_within_limit(text_body, text_body_limit_short) { return 1; }
    if !is_request_body_within_limit(bytes_body, text_body_limit_exact) { return 1; }
    if is_request_body_within_limit(bytes_body, text_body_limit_short) { return 1; }
    if count_wire_header(managed_wire.headers, "host") != 1 { return 1; }
    if count_wire_header(managed_wire.headers, "Host") != 0 { return 1; }
    if count_wire_header(managed_wire.headers, "content-length") != 0 { return 1; }
    if count_wire_header(managed_wire.headers, "Content-Length") != 0 { return 1; }
    if count_wire_header(managed_wire.headers, "Accept") != 1 { return 1; }
    if bytes_body.media_type != "application/octet-stream" { return 1; }
    if bytes_body.text != "" { return 1; }
    if bytes_response.text != "hello" { return 1; }
    if text_response_body.media_type != "text/plain" { return 1; }
    return 0;
}

flow check_response_status_and_mock_smoke() -> i32 ![Error<HttpError>] {
    let target = must_url(https("Example.COM", "v1/items"));
    let req = with_redirect_policy(
        with_timeout(
            must_request(with_checked_header(default_request(get_method(), target), "Accept", "application/json")),
            timeout_millis(1000),
        ),
        no_redirects(),
    );
    let post_req = with_body_limit(default_request(post_method(), target), default_config().body_limit);
    let decoded = response_from_text(200, "text/plain", "ok");
    let empty_wire_headers: List<HttpHeader> = [];
    let raw_wire_headers = empty_wire_headers.push(HttpHeader { name = "content-type", value = "application/octet-stream" });
    let raw_wire_response = http_response_from_wire_bytes(HttpWireResponse {
        head = HttpWireResponseHead { version = "HTTP/1.1", status = 206, reason = "Partial Content", headers = raw_wire_headers },
        body = utf8_encode("raw-body"),
    });
    let direct_wire_response = http_response_from_wire_head(
        HttpWireResponseHead { version = "HTTP/1.1", status = 202, reason = "Accepted", headers = empty_wire_headers },
        "application/json",
        "{\"accepted\":true}",
    );
    let wire_decoded = response_from_wire_head(
        HttpWireResponseHead { version = "HTTP/1.1", status = 204, reason = "No Content", headers = empty_wire_headers },
        "text/plain",
        "",
    );
    let bad_status = response_from_text(99, "text/plain", "bad");
    let mock = mock_response(200, "text/plain", "ok");
    let scope = request_scope(req.method, req.url);
    let routes = [route(get_method(), "example.com", "/v1/items", mock)];
    let matched_route = match_route(routes, req);
    let unmatched_route = match_route(routes, post_req);

    if !decoded.ok { return 1; }
    if direct_wire_response.status != 202 { return 1; }
    if direct_wire_response.body.media_type != "application/json" { return 1; }
    if direct_wire_response.body.text != "{\"accepted\":true}" { return 1; }
    if raw_wire_response.status != 206 { return 1; }
    if raw_wire_response.body.media_type != "application/octet-stream" { return 1; }
    if raw_wire_response.body.text != "raw-body" { return 1; }
    if !wire_decoded.ok { return 1; }
    if wire_decoded.response.status != 204 { return 1; }
    if !is_success_status(decoded.response.status) { return 1; }
    if !is_redirect_status(302) { return 1; }
    if !is_client_error_status(404) { return 1; }
    if bad_status.ok { return 1; }
    if bad_status.message != "invalid status" { return 1; }
    if decoded.response.body.text != "ok" { return 1; }
    if http_method_value(scope.method) != "GET" { return 1; }
    if scope.scheme != "https" { return 1; }
    if scope.host != "example.com" { return 1; }
    if scope.port != 443 { return 1; }
    if !matched_route.matched { return 1; }
    if matched_route.response_status != 200 { return 1; }
    if matched_route.response_text != "ok" { return 1; }
    if unmatched_route.matched { return 1; }
    if unmatched_route.response_status != -1 { return 1; }
    if unmatched_route.error.message != "mock route not matched" { return 1; }
    if unmatched_route.error.target != "/v1/items" { return 1; }
    return 0;
}

flow main(args: Array<string>) -> i32 ![Error<IndexError>, Error<HttpError>] {
    if check_phase1_request_lengths_target(args) != 0 { return 1; }
    if check_phase1_forged_length_target(args) != 0 { return 1; }
    if check_phase1_empty_content_length_target(args) != 0 { return 1; }
    if check_phase1_content_type_target(args) != 0 { return 1; }
    if check_phase1_response_compatibility_target(args) != 0 { return 1; }
    if check_url_and_header_smoke() != 0 { return 1; }
    if check_request_options_and_body_smoke() != 0 { return 1; }
    if check_response_status_and_mock_smoke() != 0 { return 1; }
    if check_error_mappings() != 0 { return 1; }
    return 0;
}

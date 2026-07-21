module tests.edk.http_pure_surface.main;

import std.codec.text.utf8_encode;
import edk.http.body.{bytes, response_bytes, response_text as body_response_text, text};
import edk.http.client.defaults.{default_request, default_retry_policy, no_redirects, timeout_millis, with_checked_header, with_redirect_policy, with_timeout};
import edk.http.errors.HttpError;
import edk.http.headers.{can_user_set_header, count, find, is_managed_header_name, is_valid_header_name, is_valid_header_value, single_checked};
import edk.http.handlers.preflight.preflight_request;
import edk.http.mocks.routes.{match_route, route};
import edk.http.mocks.server.response as mock_response;
import edk.http.pure.method.{get_method, http_method, http_method_value, is_supported_method, post_method};
import edk.http.pure.redirect.{redirect_limit_exceeded, should_follow_redirect};
import edk.http.pure.retry_plan.{retry_delay_millis, should_retry_status};
import edk.http.pure.ssrf.is_ssrf_risk_host;
import edk.http.pure.status.{is_client_error_status, is_redirect_status, is_server_error_status, is_success_status};
import edk.http.url.{https, is_private_or_reserved_host, is_valid_host, is_valid_path_and_query, is_valid_port, normalize_path};
import edk.http.url.parse.parse_url;
import edk.http.url.scope.request_scope;
import edk.http.types.{BodyLimit, Header, HeaderSpec, Headers, HttpMethod, HttpRequest, PublicHttpUrl, RedirectPolicy, RequestBody, RetryPolicy, Timeout, Url, UserHeaderName, header_value_evidence, http_method_evidence, user_header_name_evidence};
import edk.http.wire.decode_response.response_from_text;
import edk.http.wire.body_limit.{is_body_within_limit, is_request_body_within_limit};
import edk.http.wire.lower_request.{encode_request, lower_wire_request};

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

flow method_ok(result: Result<HttpMethod, HttpError>) -> bool ![] {
    match result {
        Ok(method) => {
            return true;
        }
        Err(error) => {
            return false;
        }
    }
}

flow check_url_and_headers() -> i32 ![Error<IndexError>, Error<HttpError>] {
    let parsed = parse_url("https://Example.COM/api/items");
    let parsed_query = parse_url("https://Example.COM?tag=edk");
    let parsed_path_query = parse_url("https://Example.COM/api/items?tag=edk/a");
    let parsed_default_port = parse_url("https://example.com:443/api/items");
    let parsed_custom_port = parse_url("https://example.com:8443/api/items");
    let invalid_port_text = parse_url("https://example.com:abc/api/items");
    let invalid_port_range = parse_url("https://example.com:70000/api/items");
    let unsupported = parse_url("ftp://example.com/archive");
    let missing_scheme = parse_url("example.com/archive");
    let missing_host = parse_url("https://");
    let invalid_host = parse_url("https://bad host/archive");
    let private_host = parse_url("https://127.0.0.1/archive");
    let userinfo_host = parse_url("https://user@example.com/archive");
    let backslash_path = parse_url("https://example.com/api\\items");
    let newline_path = parse_url("https://example.com/api\nInjected: bad");
    let backslash_host = parse_url("https://example.com\\evil.test/archive");
    let repeated_dot_host = parse_url("https://example..com/archive");
    let leading_dot_host = parse_url("https://.example.com/archive");
    let trailing_dot_host = parse_url("https://example.com./archive");
    let leading_hyphen_host = parse_url("https://-example.com/archive");
    let trailing_hyphen_host = parse_url("https://example-.com/archive");
    let underscore_host = parse_url("https://api_example.com/archive");
    let fragment_path = parse_url("https://example.com/archive#section");
    let query_fragment = parse_url("https://example.com/archive?tag=edk#section");
    let space_path = parse_url("https://example.com/archive path");
    let target = must_url(https("Example.COM", "api/items"));
    let headers = must_headers(single_checked("Content-Type", "application/json; charset=utf-8"));
    let content_type = find(headers, "content-type");
    let overwritten = must_request(with_checked_header(
        must_request(with_checked_header(default_request(get_method(), target), "Content-Type", "text/plain")),
        "content-type",
        "application/json",
    ));
    let overwritten_content_type = find(overwritten.headers, "Content-Type");
    let host_attempt = with_checked_header(default_request(get_method(), target), "Host", "evil.example");
    let connection_attempt = with_checked_header(default_request(get_method(), target), "Connection", "keep-alive");
    let bad_header_attempt = with_checked_header(default_request(get_method(), target), "Bad Header", "x");
    let text_body = text("text/plain", "hello");
    let text_body_limit_exact = BodyLimit { max_bytes = 5 };
    let text_body_limit_short = BodyLimit { max_bytes = 4 };
    let bytes_body = bytes("application/octet-stream", utf8_encode("hello"));
    let bytes_response = response_bytes("application/octet-stream", utf8_encode("hello"));
    let text_response_body = body_response_text("text/plain", "hello");

    if !parsed.ok { return 0; }
    if parsed.url.host != "example.com" { return 0; }
    if parsed.url.path_and_query != "/api/items" { return 0; }
    if !parsed_query.ok { return 0; }
    if parsed_query.url.host != "example.com" { return 0; }
    if parsed_query.url.path_and_query != "/?tag=edk" { return 0; }
    if !parsed_path_query.ok { return 0; }
    if parsed_path_query.url.host != "example.com" { return 0; }
    if parsed_path_query.url.path_and_query != "/api/items?tag=edk/a" { return 0; }
    if !parsed_default_port.ok { return 0; }
    if parsed_default_port.url.port != 443 { return 0; }
    if !parsed_custom_port.ok { return 0; }
    if parsed_custom_port.url.port != 8443 { return 0; }
    if invalid_port_text.ok { return 0; }
    if invalid_port_text.message != "invalid port" { return 0; }
    if invalid_port_range.ok { return 0; }
    if invalid_port_range.message != "invalid port" { return 0; }
    if unsupported.ok { return 0; }
    if unsupported.message != "unsupported scheme" { return 0; }
    if missing_scheme.ok { return 0; }
    if missing_scheme.message != "missing scheme separator" { return 0; }
    if missing_host.ok { return 0; }
    if missing_host.message != "missing host" { return 0; }
    if invalid_host.ok { return 0; }
    if invalid_host.message != "invalid host" { return 0; }
    if !private_host.ok { return 0; }
    if private_host.url.host != "127.0.0.1" { return 0; }
    if !is_private_or_reserved_host(private_host.url.host) { return 0; }
    if userinfo_host.ok { return 0; }
    if userinfo_host.message != "invalid host" { return 0; }
    if backslash_path.ok { return 0; }
    if backslash_path.message != "invalid path" { return 0; }
    if newline_path.ok { return 0; }
    if newline_path.message != "invalid path" { return 0; }
    if backslash_host.ok { return 0; }
    if backslash_host.message != "invalid host" { return 0; }
    if repeated_dot_host.ok { return 0; }
    if repeated_dot_host.message != "invalid host" { return 0; }
    if leading_dot_host.ok { return 0; }
    if leading_dot_host.message != "invalid host" { return 0; }
    if trailing_dot_host.ok { return 0; }
    if trailing_dot_host.message != "invalid host" { return 0; }
    if leading_hyphen_host.ok { return 0; }
    if leading_hyphen_host.message != "invalid host" { return 0; }
    if trailing_hyphen_host.ok { return 0; }
    if trailing_hyphen_host.message != "invalid host" { return 0; }
    if underscore_host.ok { return 0; }
    if underscore_host.message != "invalid host" { return 0; }
    if fragment_path.ok { return 0; }
    if fragment_path.message != "invalid path" { return 0; }
    if query_fragment.ok { return 0; }
    if query_fragment.message != "invalid path" { return 0; }
    if space_path.ok { return 0; }
    if space_path.message != "invalid path" { return 0; }
    if target.path_and_query != "/api/items" { return 0; }
    if !is_valid_host("example.com") { return 0; }
    if is_valid_host("bad host") { return 0; }
    if !is_valid_host("localhost") { return 0; }
    if !is_valid_host("127.0.0.1") { return 0; }
    if !is_valid_host("10.0.0.5") { return 0; }
    if !is_private_or_reserved_host("LOCALHOST") { return 0; }
    if is_valid_host("bad\thost") { return 0; }
    if is_valid_host("example..com") { return 0; }
    if is_valid_host(".example.com") { return 0; }
    if is_valid_host("example.com.") { return 0; }
    if is_valid_host("-example.com") { return 0; }
    if is_valid_host("example-.com") { return 0; }
    if is_valid_host("api_example.com") { return 0; }
    if is_valid_host("example.com?tag=edk") { return 0; }
    if is_valid_host("user@example.com") { return 0; }
    if is_valid_host("example.com:443") { return 0; }
    if !is_valid_port(443) { return 0; }
    if is_valid_port(0) { return 0; }
    if is_valid_port(70000) { return 0; }
    if normalize_path("health") != "/health" { return 0; }
    if !is_valid_path_and_query("/api/items?tag=edk") { return 0; }
    if is_valid_path_and_query("/api/items#section") { return 0; }
    if is_valid_path_and_query("/api items") { return 0; }
    if is_valid_path_and_query("/api\titems") { return 0; }
    if !is_supported_method("get") { return 0; }
    if !is_supported_method("PATCH") { return 0; }
    if is_supported_method("trace") { return 0; }
    if !method_ok(http_method("GET")) { return 0; }
    if method_ok(http_method("TRACE")) { return 0; }
    if count(headers) != 1 { return 0; }
    if !content_type.found { return 0; }
    if content_type.value != "application/json; charset=utf-8" { return 0; }
    if !is_valid_header_name("Accept") { return 0; }
    if is_valid_header_name("Bad Header") { return 0; }
    if is_valid_header_name("Bad/Header") { return 0; }
    if is_valid_header_name("Bad@Header") { return 0; }
    if is_valid_header_name("Bad(Header)") { return 0; }
    if is_valid_header_name("Bad=Header") { return 0; }
    if is_valid_header_name("Bad\tHeader") { return 0; }
    if is_valid_header_name("Bad\nHeader") { return 0; }
    if !is_valid_header_value("application/json; charset=utf-8") { return 0; }
    if is_valid_header_value("ok\r\nInjected: bad") { return 0; }
    if !can_user_set_header("Content-Type", "application/json") { return 0; }
    if can_user_set_header("Host", "example.com") { return 0; }
    if can_user_set_header("Content-Length", "10") { return 0; }
    if can_user_set_header("Connection", "keep-alive") { return 0; }
    if can_user_set_header("Bad Header", "x") { return 0; }
    if !is_managed_header_name("Host") { return 0; }
    if !is_managed_header_name("content-length") { return 0; }
    if !is_managed_header_name("CONNECTION") { return 0; }
    if is_managed_header_name("Accept") { return 0; }
    if count(overwritten.headers) != 1 { return 0; }
    if !overwritten_content_type.found { return 0; }
    if overwritten_content_type.value != "application/json" { return 0; }
    if request_error_kind(host_attempt) != "managed_header" { return 0; }
    if request_error_kind(connection_attempt) != "managed_header" { return 0; }
    if request_error_kind(bad_header_attempt) != "invalid_header_name" { return 0; }
    if text_body.text != "hello" { return 0; }
    if !is_request_body_within_limit(text_body, text_body_limit_exact) { return 0; }
    if is_request_body_within_limit(text_body, text_body_limit_short) { return 0; }
    if bytes_body.media_type != "application/octet-stream" { return 0; }
    if bytes_body.text != "" { return 0; }
    if bytes_response.text != "" { return 0; }
    if text_response_body.media_type != "text/plain" { return 0; }
    return 1;
}

flow check_request_and_response() -> i32 ![Error<HttpError>] {
    let target = must_url(https("example.com", "submit"));
    let request = with_redirect_policy(
        with_timeout(
            must_request(with_checked_header(default_request(raw_method("post"), target), "content-type", "application/json")),
            timeout_millis(2500),
        ),
        no_redirects(),
    );
    let encoded = encode_request(request);
    let wire = lower_wire_request(request);
    let decoded = response_from_text(201, "text/plain", "created");
    let invalid_status = response_from_text(700, "text/plain", "bad");
    let mock = mock_response(200, "text/plain", "created");
    let retry = default_retry_policy();
    let scope = request_scope(request.method, request.url);
    let routes = [route(post_method(), "example.com", "/submit", mock)];
    let matched_route = match_route(routes, request);
    let unmatched_route = match_route(routes, default_request(get_method(), target));

    if http_method_value(encoded.method) != "POST" { return 0; }
    if encoded.target != "/submit" { return 0; }
    if wire.method != "POST" { return 0; }
    if wire.target != "/submit" { return 0; }
    if request.timeout.millis != 2500 { return 0; }
    if request.redirect.follow { return 0; }
    if !decoded.ok { return 0; }
    if decoded.response.status != 201 { return 0; }
    if !is_success_status(decoded.response.status) { return 0; }
    if !is_redirect_status(307) { return 0; }
    if !is_client_error_status(404) { return 0; }
    if !is_server_error_status(503) { return 0; }
    if invalid_status.ok { return 0; }
    if invalid_status.message != "invalid status" { return 0; }
    if decoded.response.body.text != "created" { return 0; }
    if http_method_value(scope.method) != "POST" { return 0; }
    if scope.scheme != "https" { return 0; }
    if scope.host != "example.com" { return 0; }
    if scope.port != 443 { return 0; }
    if !matched_route.matched { return 0; }
    if matched_route.response_status != 200 { return 0; }
    if matched_route.response_text != "created" { return 0; }
    if unmatched_route.matched { return 0; }
    if unmatched_route.response_status != -1 { return 0; }
    if unmatched_route.error.message != "mock route not matched" { return 0; }
    if unmatched_route.error.target != "/submit" { return 0; }
    if !is_body_within_limit(2048, request.body_limit) { return 0; }
    if is_body_within_limit(1048577, request.body_limit) { return 0; }
    if should_follow_redirect(302, request.redirect, 0) { return 0; }
    if redirect_limit_exceeded(request.redirect, 0) { return 0; }
    if !should_retry_status(503, 0, retry) { return 0; }
    if retry_delay_millis(3, retry) != 0 { return 0; }
    if !is_ssrf_risk_host("127.0.0.1") { return 0; }
    if !is_ssrf_risk_host("10.0.0.5") { return 0; }
    if is_ssrf_risk_host("example.com") { return 0; }
    return 1;
}

flow check_preflight_rejections(request: HttpRequest) -> i32 ![] {
    let bad_preflight_method = preflight_request(get_method(), request.url.host, request);
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
        url = Url { scheme = "ftp", host = "example.com", port = 21, path_and_query = "/submit" },
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_port = HttpRequest {
        method = request.method,
        url = Url { scheme = "https", host = "example.com", port = 0, path_and_query = "/submit" },
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let private_host = HttpRequest {
        method = request.method,
        url = Url { scheme = "https", host = "127.0.0.1", port = 443, path_and_query = "/submit" },
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_header_name = HttpRequest {
        method = request.method,
        url = request.url,
        headers = Headers { entries = [trusted_header("Bad Header", "x")] },
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
    let bad_header_value = HttpRequest {
        method = request.method,
        url = request.url,
        headers = Headers { entries = [trusted_header("Accept", "ok\r\nInjected: bad")] },
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

    if preflight_request(request.method, request.url.host, request).ok == false { return 0; }
    if bad_preflight_method.error.kind != "invalid_request" { return 0; }
    if bad_preflight_host.error.kind != "invalid_request" { return 0; }
    if preflight_request(raw_method("TRACE"), request.url.host, bad_method).error.kind != "invalid_method" { return 0; }
    if preflight_request(request.method, "example.com", bad_url).error.kind != "invalid_url" { return 0; }
    if preflight_request(request.method, "example.com", bad_port).error.kind != "invalid_url" { return 0; }
    if !preflight_request(request.method, "127.0.0.1", private_host).ok { return 0; }
    if !is_ssrf_risk_host(private_host.url.host) { return 0; }
    if preflight_request(request.method, request.url.host, bad_header_name).error.kind != "invalid_header" { return 0; }
    if preflight_request(request.method, request.url.host, bad_header_value).error.kind != "invalid_header" { return 0; }
    if preflight_request(request.method, request.url.host, bad_body_limit).error.kind != "body_limit" { return 0; }
    if preflight_request(request.method, request.url.host, body_too_large).error.kind != "body_limit" { return 0; }
    if preflight_request(request.method, request.url.host, bad_timeout).error.kind != "timeout" { return 0; }
    if preflight_request(request.method, request.url.host, bad_redirect).error.kind != "redirect" { return 0; }
    if preflight_request(request.method, request.url.host, bad_retry_attempts).error.kind != "retry" { return 0; }
    if preflight_request(request.method, request.url.host, bad_retry_backoff).error.kind != "retry" { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![Error<IndexError>, Error<HttpError>] {
    let submit = must_url(https("example.com", "submit"));
    let request = with_redirect_policy(
        with_timeout(
            must_request(with_checked_header(default_request(raw_method("post"), submit), "content-type", "application/json")),
            timeout_millis(2500),
        ),
        no_redirects(),
    );
    if check_url_and_headers() + check_request_and_response() + check_preflight_rejections(request) == 3 {
        return 0;
    }
    return 1;
}

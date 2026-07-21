module std_requirements.http.positive.edk_http_error_mapping_contract.main;

import std.codec.text.utf8_encode;
import edk.http.body.{empty, text};
import edk.http.client.defaults.default_request;
import edk.http.errors.{HttpError, codec_error, network_transport_error, response_body_limit_error, response_body_read_error, stream_transport_error, tls_transport_error};
import edk.http.headers.empty_headers;
import edk.http.handlers.preflight.preflight_request;
import edk.http.pure.method.{get_method, post_method};
import edk.http.types.{BodyLimit, Header, HeaderSpec, Headers, HttpRequest, PublicHttpUrl, RedirectPolicy, RequestBody, RetryPolicy, Timeout, Url, UserHeaderName, header_value_evidence, http_method_evidence, public_http_url_evidence, user_header_name_evidence};
import edk.http.url.{https, public_url_value};

flow check_transport_error_kinds() -> i32 ![] {
    let codec = codec_error("HTTP response head decoding failed");
    let network = network_transport_error("TCP connect failed");
    let tls = tls_transport_error("TLS handshake failed");
    let stream = stream_transport_error("TCP stream write failed");
    let response_read = response_body_read_error("TCP response body read failed or timed out");
    let response_limit = response_body_limit_error("TCP response body exceeded configured body limit");
    let bad_status = codec_error("HTTP response status is invalid");

    if codec.kind != "codec" { return 1; }
    if network.kind != "network" { return 1; }
    if tls.kind != "tls" { return 1; }
    if stream.kind != "stream" { return 1; }
    if response_read.kind != "response_body_read" { return 1; }
    if response_read.message != "TCP response body read failed or timed out" { return 1; }
    if response_limit.kind != "response_body_limit" { return 1; }
    if response_limit.message != "TCP response body exceeded configured body limit" { return 1; }
    if bad_status.kind != "codec" { return 1; }
    if bad_status.message != "HTTP response status is invalid" { return 1; }
    return 0;
}

flow fallback_public_url() -> PublicHttpUrl ![] {
    return public_http_url_evidence(Url { scheme = "https", host = "example.com", port = 443, path_and_query = "/" });
}

flow checked_url(result: Result<PublicHttpUrl, HttpError>) -> PublicHttpUrl ![] {
    return match result {
        Ok(url) => url,
        Err(_) => fallback_public_url(),
    };
}

flow checked_url_value(result: Result<PublicHttpUrl, HttpError>) -> Url ![] {
    return public_url_value(checked_url(result));
}

flow raw_header(name: string, value: string) -> Header ![] {
    return HeaderSpec<UserHeaderName> {
        name = user_header_name_evidence(name),
        value = header_value_evidence(value),
    };
}

flow check_invalid_request_mapping() -> i32 ![] {
    let good = default_request(get_method(), checked_url(https("example.com", "/status")));
    let submit_url = checked_url_value(https("example.com", "/submit"));
    let bad_method = HttpRequest {
        method = http_method_evidence("TRACE"),
        url = good.url,
        headers = good.headers,
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let invalid_url = HttpRequest {
        method = get_method(),
        url = Url { scheme = "ftp", host = "example.com", port = 21, path_and_query = "/status" },
        headers = empty_headers(),
        body = empty(),
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let invalid_path = HttpRequest {
        method = get_method(),
        url = Url { scheme = "https", host = "example.com", port = 443, path_and_query = "/status#fragment" },
        headers = good.headers,
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let invalid_port = HttpRequest {
        method = get_method(),
        url = Url { scheme = "https", host = "example.com", port = 0, path_and_query = "/status" },
        headers = good.headers,
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let private_host = HttpRequest {
        method = get_method(),
        url = Url { scheme = "https", host = "127.0.0.1", port = 443, path_and_query = "/status" },
        headers = good.headers,
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let invalid_header_name = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = Headers { entries = [raw_header("Bad Header", "x")] },
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let invalid_header_value = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = Headers { entries = [raw_header("Accept", "ok\r\nInjected: bad")] },
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let managed_host_header = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = Headers { entries = [raw_header("Host", "evil.example")] },
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let managed_length_header = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = Headers { entries = [raw_header("Content-Length", "10")] },
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let managed_connection_header = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = Headers { entries = [raw_header("Connection", "keep-alive")] },
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let zero_body_limit = HttpRequest {
        method = post_method(),
        url = submit_url,
        headers = Headers { entries = [raw_header("Content-Type", "text/plain")] },
        body = text("text/plain", "payload"),
        timeout = Timeout { millis = 1000 },
        body_limit = BodyLimit { max_bytes = 0 },
        retry = RetryPolicy { max_attempts = 1, backoff_millis = 0 },
        redirect = RedirectPolicy { follow = false, max_hops = 0 },
    };
    let invalid_body_limit = HttpRequest {
        method = post_method(),
        url = submit_url,
        headers = Headers { entries = [raw_header("Content-Type", "text/plain")] },
        body = text("text/plain", "payload"),
        timeout = Timeout { millis = 1000 },
        body_limit = BodyLimit { max_bytes = 3 },
        retry = RetryPolicy { max_attempts = 1, backoff_millis = 0 },
        redirect = RedirectPolicy { follow = false, max_hops = 0 },
    };
    let invalid_timeout = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = good.headers,
        body = good.body,
        timeout = Timeout { millis = 0 },
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = good.redirect,
    };
    let invalid_redirect = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = good.headers,
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = good.retry,
        redirect = RedirectPolicy { follow = true, max_hops = -1 },
    };
    let invalid_retry_attempts = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = good.headers,
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = RetryPolicy { max_attempts = 0, backoff_millis = 0 },
        redirect = good.redirect,
    };
    let invalid_retry_backoff = HttpRequest {
        method = get_method(),
        url = good.url,
        headers = good.headers,
        body = good.body,
        timeout = good.timeout,
        body_limit = good.body_limit,
        retry = RetryPolicy { max_attempts = 1, backoff_millis = -1 },
        redirect = good.redirect,
    };

    if preflight_request(post_method(), "example.com", good).error.kind != "invalid_request" { return 1; }
    if preflight_request(get_method(), "api.example.com", good).error.kind != "invalid_request" { return 1; }
    if preflight_request(http_method_evidence("TRACE"), "example.com", bad_method).error.kind != "invalid_method" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_url).error.kind != "invalid_url" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_path).error.kind != "invalid_url" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_port).error.kind != "invalid_url" { return 1; }
    if !preflight_request(get_method(), "127.0.0.1", private_host).ok { return 1; }
    if preflight_request(get_method(), "example.com", invalid_header_name).error.kind != "invalid_header" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_header_value).error.kind != "invalid_header" { return 1; }
    if preflight_request(get_method(), "example.com", managed_host_header).error.kind != "invalid_header" { return 1; }
    if preflight_request(get_method(), "example.com", managed_length_header).error.kind != "invalid_header" { return 1; }
    if preflight_request(get_method(), "example.com", managed_connection_header).error.kind != "invalid_header" { return 1; }
    if preflight_request(post_method(), "example.com", zero_body_limit).error.kind != "body_limit" { return 1; }
    if preflight_request(post_method(), "example.com", invalid_body_limit).error.kind != "body_limit" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_timeout).error.kind != "timeout" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_redirect).error.kind != "redirect" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_retry_attempts).error.kind != "retry" { return 1; }
    if preflight_request(get_method(), "example.com", invalid_retry_backoff).error.kind != "retry" { return 1; }
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    if check_transport_error_kinds() != 0 { return 1; }
    if check_invalid_request_mapping() != 0 { return 1; }
    return 0;
}

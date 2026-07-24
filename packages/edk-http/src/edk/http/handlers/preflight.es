module edk.http.handlers.preflight;

import std.text.{lowercase, trim};
import edk.http.errors.HttpError;
import edk.http.headers.build.{header_name, header_text_value, is_managed_header_name, user_header_name_value};
import edk.http.headers.validate.{is_valid_header_name, is_valid_header_value, is_valid_media_type};
import edk.http.pure.method.{http_method_value, is_supported_method, normalize_http_method};
import edk.http.types.{Headers, HttpMethod, HttpRequest, Url};
import edk.http.url.validate.{is_supported_scheme, is_valid_host, is_valid_path_and_query, is_valid_port};
import edk.http.wire.body_limit.is_request_body_within_limit;

public alias HttpPreflightResult = {
    ok: bool,
    error: HttpError,
};

flow ok_preflight() -> HttpPreflightResult ![] {
    return HttpPreflightResult {
        ok = true,
        error = HttpError {
            kind = "",
            message = "",
        },
    };
}

flow preflight_error(kind: string, message: string) -> HttpPreflightResult ![] {
    return HttpPreflightResult {
        ok = false,
        error = HttpError {
            kind = kind,
            message = message,
        },
    };
}

flow preflight_headers(headers: Headers) -> HttpPreflightResult ![] {
    var content_types = 0;
    for header in headers.entries limit Iterations(65536) {
        let name = user_header_name_value(header_name(header));
        let normalized = lowercase(trim(name));
        let value = header_text_value(header);
        if !is_valid_header_name(name) {
            return preflight_error("invalid_header", "invalid HTTP header name");
        }
        if !is_valid_header_value(value) {
            return preflight_error("invalid_header", "invalid HTTP header value");
        }
        if normalized == "content-type" {
            content_types = content_types + 1;
            if content_types > 1 {
                return preflight_error("invalid_header", "duplicate Content-Type header");
            }
            if value == "" || !is_valid_media_type(value) {
                return preflight_error("invalid_header", "invalid Content-Type header");
            }
        }
        if is_managed_header_name(name) {
            return preflight_error("invalid_header", "managed HTTP header cannot be set by caller");
        }
    }
    return ok_preflight();
}

flow preflight_url(url: Url) -> HttpPreflightResult ![] {
    if !is_supported_scheme(url.scheme) {
        return preflight_error("invalid_url", "unsupported URL scheme");
    }
    if !is_valid_host(url.host) {
        return preflight_error("invalid_url", "invalid URL host");
    }
    if !is_valid_port(url.port) {
        return preflight_error("invalid_url", "invalid URL port");
    }
    if !is_valid_path_and_query(url.path_and_query) {
        return preflight_error("invalid_url", "invalid URL path or query");
    }
    return ok_preflight();
}

public flow preflight_request(method: HttpMethod, host: string, request: HttpRequest) -> HttpPreflightResult ![] {
    let normalized = normalize_http_method(method);
    let normalized_text = http_method_value(normalized);
    let request_method = http_method_value(request.method);
    if normalized_text != request_method {
        return preflight_error("invalid_request", "request method does not match action scope");
    }
    if host != request.url.host {
        return preflight_error("invalid_request", "request host does not match action scope");
    }
    if !is_supported_method(normalized_text) {
        return preflight_error("invalid_method", "unsupported HTTP method");
    }
    let url = preflight_url(request.url);
    if !url.ok {
        return url;
    }
    let headers = preflight_headers(request.headers);
    if !headers.ok {
        return headers;
    }
    if !is_valid_media_type(request.body.media_type) {
        return preflight_error("invalid_header", "invalid request body media type");
    }
    if request.body_limit.max_bytes == 0 {
        return preflight_error("body_limit", "body limit must be positive");
    }
    if !is_request_body_within_limit(request.body, request.body_limit) {
        return preflight_error("body_limit", "request body exceeds body limit");
    }
    if request.timeout.millis <= 0 {
        return preflight_error("timeout", "timeout must be positive");
    }
    if request.redirect.max_hops < 0 {
        return preflight_error("redirect", "redirect hop limit must not be negative");
    }
    if request.retry.max_attempts <= 0 {
        return preflight_error("retry", "retry attempts must be positive");
    }
    if request.retry.backoff_millis < 0 {
        return preflight_error("retry", "retry backoff must not be negative");
    }
    return ok_preflight();
}

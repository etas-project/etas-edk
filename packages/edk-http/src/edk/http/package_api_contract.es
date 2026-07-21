module edk.http.package_api_contract;

import edk.http.{delete as http_delete, get, get_url, head, patch, post, put};
import edk.http.api.{get as api_get, post as api_post};
import edk.http.body.{text as request_text};
import edk.http.client.defaults.{default_options, normalize_request, request_with_body_options, request_with_options};
import edk.http.errors.HttpError;
import edk.http.pure.method.{http_method_value, patch_method, post_method};
import edk.http.types.{BodyLimit, Header, HeaderSpec, Headers, HttpRequest, HttpResponse, PublicHttpUrl, RedirectPolicy, RetryPolicy, Timeout, Url, UserHeaderName, header_value_evidence, user_header_name_evidence};
import edk.http.url.{https, parse_public_url};

flow checked_public_url(value: string) -> PublicHttpUrl ![Error<HttpError>] {
    return match parse_public_url(value) {
        Ok(url) => url,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow checked_url(result: Result<PublicHttpUrl, HttpError>) -> PublicHttpUrl ![Error<HttpError>] {
    return match result {
        Ok(url) => url,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow trusted_header(name: string, value: string) -> Header ![] {
    return HeaderSpec<UserHeaderName> {
        name = user_header_name_evidence(name),
        value = header_value_evidence(value),
    };
}

flow check_get_url() -> HttpResponse ![Error<HttpError>] {
    return get_url(checked_public_url("https://example.com/status"), default_options());
}

flow check_get() -> HttpResponse ![Error<HttpError>] {
    return get("https://example.com/status", default_options());
}

flow check_api_get() -> HttpResponse ![Error<HttpError>] {
    return api_get("https://example.com/status", default_options());
}

flow check_post() -> HttpResponse ![Error<HttpError>] {
    return post("https://example.com/submit", request_text("text/plain", "payload"), default_options());
}

flow check_api_post() -> HttpResponse ![Error<HttpError>] {
    return api_post("https://example.com/submit", request_text("text/plain", "payload"), default_options());
}

flow check_put() -> HttpResponse ![Error<HttpError>] {
    return put("https://example.com/replace", request_text("text/plain", "payload"), default_options());
}

flow check_patch() -> HttpResponse ![Error<HttpError>] {
    return patch("https://example.com/update", request_text("text/plain", "payload"), default_options());
}

flow check_delete() -> HttpResponse ![Error<HttpError>] {
    return http_delete("https://example.com/remove", default_options());
}

flow check_head() -> HttpResponse ![Error<HttpError>] {
    return head("https://example.com/status", default_options());
}

flow check_post_request_preserves_body() -> i32 ![Error<HttpError>] {
    let req = request_with_body_options(
        post_method(),
        checked_url(https("example.com", "/submit")),
        request_text("text/plain", "payload"),
        default_options(),
    );
    if http_method_value(req.method) != "POST" { return 1; }
    if req.url.host != "example.com" { return 1; }
    if req.body.media_type != "text/plain" { return 1; }
    if req.body.text != "payload" { return 1; }
    return 0;
}

flow check_request_options_preserved() -> i32 ![] {
    let req = normalize_request(HttpRequest {
        method = patch_method(),
        url = Url { scheme = "https", host = "example.com", port = 443, path_and_query = "/update" },
        headers = Headers { entries = [trusted_header("Accept", "text/plain")] },
        body = request_text("text/plain", "payload"),
        timeout = Timeout { millis = 1234 },
        body_limit = BodyLimit { max_bytes = 4321 },
        retry = RetryPolicy { max_attempts = 3, backoff_millis = 250 },
        redirect = RedirectPolicy { follow = false, max_hops = 0 },
    });
    if http_method_value(req.method) != "PATCH" { return 1; }
    if req.timeout.millis != 1234 { return 1; }
    if req.body_limit.max_bytes != 4321 { return 1; }
    if req.retry.max_attempts != 3 { return 1; }
    if req.retry.backoff_millis != 250 { return 1; }
    if req.redirect.follow { return 1; }
    if req.redirect.max_hops != 0 { return 1; }
    return 0;
}

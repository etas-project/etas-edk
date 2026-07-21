module std_requirements.http.positive.edk_http_request_contract.main;

import edk.http.body.{empty as empty_body, text};
import edk.http.client.defaults.{default_options, normalize_request, request_with_body_options, request_with_options};
import edk.http.errors.HttpError;
import edk.http.pure.method.{get_method, http_method_value, patch_method, post_method};
import edk.http.types.{BodyLimit, Header, HeaderSpec, Headers, HttpRequest, PublicHttpUrl, RedirectPolicy, RetryPolicy, Timeout, Url, UserHeaderName, header_value_evidence, user_header_name_evidence};
import edk.http.url.https;

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

flow main(args: Array<string>) -> i32 ![Error<HttpError>] {
    let empty = empty_body();
    let body = text("text/plain", "payload");
    let req = request_with_body_options(post_method(), checked_url(https("example.com", "/submit")), body, default_options());
    let get_req = request_with_options(get_method(), checked_url(https("example.com", "/status")), default_options());
    let custom = normalize_request(HttpRequest {
        method = patch_method(),
        url = Url { scheme = "https", host = "example.com", port = 443, path_and_query = "/update" },
        headers = Headers { entries = [trusted_header("Accept", "text/plain")] },
        body = text("text/plain", "payload"),
        timeout = Timeout { millis = 1234 },
        body_limit = BodyLimit { max_bytes = 4321 },
        retry = RetryPolicy { max_attempts = 3, backoff_millis = 250 },
        redirect = RedirectPolicy { follow = false, max_hops = 0 },
    });
    if http_method_value(req.method) != "POST" { return 1; }
    if req.url.host != "example.com" { return 1; }
    if req.body.text != "payload" { return 1; }
    if req.body.media_type != "text/plain" { return 1; }
    if http_method_value(get_req.method) != "GET" { return 1; }
    if http_method_value(custom.method) != "PATCH" { return 1; }
    if custom.timeout.millis != 1234 { return 1; }
    if custom.body_limit.max_bytes != 4321 { return 1; }
    if custom.retry.max_attempts != 3 { return 1; }
    if custom.retry.backoff_millis != 250 { return 1; }
    if custom.redirect.follow { return 1; }
    if custom.redirect.max_hops != 0 { return 1; }
    if empty.text != "" { return 1; }
    return 0;
}

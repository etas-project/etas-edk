module tests.edk.negative.edk_http_raw_method_constructor_forbidden.main;

import edk.http.client.defaults.default_request;
import edk.http.errors.HttpError;
import edk.http.handlers.preflight.preflight_request;
import edk.http.types.{HttpMethod, PublicHttpUrl};
import edk.http.url.https;

flow checked_url(result: Result<PublicHttpUrl, HttpError>) -> PublicHttpUrl ![Error<HttpError>] {
    return match result {
        Ok(url) => url,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<HttpError>] {
    let method = HttpMethod("TRACE");
    let request = default_request(method, checked_url(https("example.com", "/")));
    let preflight = preflight_request(method, request.url.host, request);
    if preflight.ok {
        return 0;
    }
    return 1;
}

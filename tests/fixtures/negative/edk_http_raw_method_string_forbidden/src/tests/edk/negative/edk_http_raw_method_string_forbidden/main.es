module tests.edk.negative.edk_http_raw_method_string_forbidden.main;

import edk.http.client.defaults.{default_options, request_with_options};
import edk.http.errors.HttpError;
import edk.http.types.PublicHttpUrl;
import edk.http.url.https;

flow checked_url(result: Result<PublicHttpUrl, HttpError>) -> PublicHttpUrl ![Error<HttpError>] {
    return match result {
        Ok(url) => url,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<HttpError>] {
    let request = request_with_options("GET", checked_url(https("example.com", "/")), default_options());
    return 0;
}

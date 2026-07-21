module tests.edk.negative.edk_http_with_header_raw_string_forbidden.main;

import edk.http.client.defaults.{default_request, with_header};
import edk.http.errors.HttpError;
import edk.http.pure.method.get_method;
import edk.http.types.PublicHttpUrl;
import edk.http.url.https;

flow checked_url(result: Result<PublicHttpUrl, HttpError>) -> PublicHttpUrl ![Error<HttpError>] {
    return match result {
        Ok(url) => url,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<HttpError>] {
    let request = default_request(get_method(), checked_url(https("example.com", "/")));
    let updated = with_header(request, "Accept", "application/json");
    return 0;
}

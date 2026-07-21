module tests.edk.negative.edk_http_raw_public_url_constructor_forbidden.main;

import edk.http.get_url;
import edk.http.client.defaults.default_options;
import edk.http.errors.HttpError;
import edk.http.types.{PublicHttpUrl, Url};

flow main(args: Array<string>) -> i32 ![Error<HttpError>] {
    let forged = PublicHttpUrl(Url {
        scheme = "http",
        host = "127.0.0.1",
        port = 80,
        path_and_query = "/admin",
    });
    let response = get_url(forged, default_options());
    return response.status;
}

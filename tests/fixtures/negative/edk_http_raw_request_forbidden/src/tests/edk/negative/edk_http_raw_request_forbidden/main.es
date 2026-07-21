module tests.edk.negative.edk_http_raw_request_forbidden.main;

import edk.http.client.defaults.default_request;
import edk.http.pure.method.get_method;
import edk.http.types.Url;

flow main(args: Array<string>) -> i32 ![] {
    let request = default_request(get_method(), Url {
        scheme = "https",
        host = "example.com",
        port = 443,
        path_and_query = "/status",
    });
    return 0;
}

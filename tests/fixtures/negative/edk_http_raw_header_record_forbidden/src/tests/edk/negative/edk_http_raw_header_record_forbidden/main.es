module tests.edk.negative.edk_http_raw_header_record_forbidden.main;

import edk.http.headers.{append, empty_headers};
import edk.http.types.{Header, HeaderName, HeaderSpec, HeaderValue, UserHeaderName};

flow main(args: Array<string>) -> i32 ![] {
    let spec = HeaderSpec<UserHeaderName> {
        name = UserHeaderName(HeaderName("Host")),
        value = HeaderValue("evil.example"),
    };
    let item = Header(spec);
    let headers = append(empty_headers(), item);
    return 0;
}

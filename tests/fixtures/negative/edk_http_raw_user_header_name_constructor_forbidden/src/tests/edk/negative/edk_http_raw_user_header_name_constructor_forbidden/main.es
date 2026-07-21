module tests.edk.negative.edk_http_raw_user_header_name_constructor_forbidden.main;

import edk.http.headers.{append, empty_headers, header};
import edk.http.types.{HeaderName, HeaderValue, UserHeaderName};

flow main(args: Array<string>) -> i32 ![] {
    let item = header(UserHeaderName(HeaderName("Host")), HeaderValue("evil.example"));
    let headers = append(empty_headers(), item);
    return 0;
}

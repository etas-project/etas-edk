module tests.edk.negative.edk_http_managed_header_forbidden.main;

import edk.http.headers.header;

flow main(args: Array<string>) -> i32 ![] {
    let item = header("Host", "evil.example");
    return 0;
}

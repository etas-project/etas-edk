module tests.edk.negative.edk_http_private_host_client_forbidden.main;

import std.http.request as private_http_request;

flow main(args: Array<string>) -> i32 ![]
{
    private_http_request();
    return 0;
}

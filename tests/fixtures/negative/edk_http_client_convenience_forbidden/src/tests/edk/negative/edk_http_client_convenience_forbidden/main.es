module tests.edk.negative.edk_http_client_convenience_forbidden.main;

import edk.http.client.{fetch_json, fetch_text, get, post, post_json};

flow main(args: Array<string>) -> i32 ![] {
    return 0;
}

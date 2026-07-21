module std_requirements.http.negative.unhandled_action_no_handler.main;

import std.codec.text.utf8_encode;
import edk.http.policy.{HttpActionHeader, HttpActionRequest, EdkHttp};

flow main(args: Array<string>) -> i32 ![EdkHttp.request]
{
    let headers: Array<HttpActionHeader> = [];
    let req = HttpActionRequest {
        method = "GET",
        scheme = "https",
        host = "example.com",
        port = 443,
        path_and_query = "/status",
        headers = headers,
        body_media_type = "text/plain",
        body_raw = utf8_encode(""),
        body_text = "",
        body_length_bytes = 0,
        timeout_millis = 30000,
        body_limit_max_bytes = 1048576,
        retry_max_attempts = 1,
        retry_backoff_millis = 0,
        redirect_follow = true,
        redirect_max_hops = 5,
    };
    let response = perform EdkHttp.request(req);
    return response.status;
}

module edk.http.policy;

public alias HttpActionHeader = {
    name: string,
    value: string,
};

public alias HttpActionRequest = {
    method: string,
    scheme: string,
    host: string,
    port: i32,
    path_and_query: string,
    headers: Array<HttpActionHeader>,
    body_media_type: string,
    body_raw: bytes,
    body_text: string,
    body_length_bytes: usize,
    timeout_millis: i32,
    body_limit_max_bytes: usize,
    retry_max_attempts: i32,
    retry_backoff_millis: i32,
    redirect_follow: bool,
    redirect_max_hops: i32,
};

public alias HttpActionResponse = {
    status: i32,
    headers: Array<HttpActionHeader>,
    body_media_type: string,
    body_raw: bytes,
    body_text: string,
};

public effect EdkHttp extends Network {
    action request(request: HttpActionRequest) -> HttpActionResponse;
}

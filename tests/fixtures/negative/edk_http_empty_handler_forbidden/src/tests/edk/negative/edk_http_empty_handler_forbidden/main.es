module tests.edk.negative.edk_http_empty_handler_forbidden.main;

type HttpError;

type HttpActionRequest = {
    method: string,
    host: string,
};

type HttpActionResponse = {
    status: i32,
};

effect EdkHttp extends Network {
    action request(request: HttpActionRequest) -> HttpActionResponse;
}

let EmptyHttpHandler: ![EdkHttp for HttpActionResponse] = handler {};

flow main(args: Array<string>) -> i32 ![]
{
    let request = HttpActionRequest { method = "GET", host = "example.com" };
    let response = perform EdkHttp.request(request) with EmptyHttpHandler;
    return response.status;
}

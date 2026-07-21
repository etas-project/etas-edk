module edk.http.mocks.routes;

import edk.http.pure.method.{get_method, normalize_http_method};
import edk.http.types.{Host, HttpMethod, HttpRequest, HttpResponse, PathAndQuery, StatusCode};

public alias MockRoute = {
    method: HttpMethod,
    host: Host,
    target: PathAndQuery,
    response: HttpResponse,
};

public alias MockMatchError = {
    method: HttpMethod,
    host: Host,
    target: PathAndQuery,
    message: string,
};

public alias MockMatch = {
    matched: bool,
    response_status: StatusCode,
    response_media_type: string,
    response_text: string,
    error: MockMatchError,
};

flow empty_error() -> MockMatchError ![] {
    return MockMatchError {
        method = get_method(),
        host = "",
        target = "",
        message = "",
    };
}

public flow route(method: HttpMethod, host: Host, target: PathAndQuery, response: HttpResponse) -> MockRoute ![] {
    return MockRoute {
        method = normalize_http_method(method),
        host = host,
        target = target,
        response = response,
    };
}

public flow matched(response: HttpResponse) -> MockMatch ![] {
    return MockMatch {
        matched = true,
        response_status = response.status,
        response_media_type = response.body.media_type,
        response_text = response.body.text,
        error = empty_error(),
    };
}

public flow unmatched(request: HttpRequest) -> MockMatch ![] {
    return MockMatch {
        matched = false,
        response_status = -1,
        response_media_type = "",
        response_text = "",
        error = MockMatchError {
            method = normalize_http_method(request.method),
            host = request.url.host,
            target = request.url.path_and_query,
            message = "mock route not matched",
        },
    };
}

public flow match_route(routes: Array<MockRoute>, request: HttpRequest) -> MockMatch ![] {
    let method = normalize_http_method(request.method);
    for item in routes limit Iterations(65536) {
        if item.method == method
            && item.host == request.url.host
            && item.target == request.url.path_and_query
        {
            return matched(item.response);
        }
    }
    return unmatched(request);
}

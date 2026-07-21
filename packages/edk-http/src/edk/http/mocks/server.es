module edk.http.mocks.server;

import edk.http.body.response_body;
import edk.http.types.{HttpRequest, HttpResponse, ResponseHeader, ResponseHeaders};

flow empty_response_headers() -> ResponseHeaders ![] {
    let entries: Array<ResponseHeader> = [];
    return ResponseHeaders { entries = entries };
}

public flow response(status: i32, media_type: string, body: string) -> HttpResponse ![] {
    return HttpResponse {
        status = status,
        headers = empty_response_headers(),
        body = response_body(media_type, body),
    };
}

public flow text_response(body: string) -> HttpResponse ![] {
    return response(200, "text/plain", body);
}

public flow not_found(request: HttpRequest) -> HttpResponse ![] {
    return response(404, "text/plain", request.url.path_and_query);
}

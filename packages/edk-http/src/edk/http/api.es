module edk.http.api;

import edk.http.action_payload.{lower_request, lower_response, raise_request, raise_response};
import edk.http.client.defaults.{normalize_request, request_with_body_options, request_with_options};
import edk.http.policy.{HttpActionResponse, EdkHttp};
import edk.http.handlers.preflight.preflight_request;
import edk.http.pure.method.{delete_method, get_method, head_method, patch_method, post_method, put_method};
import edk.http.transport.execute_request;
import edk.http.types.{HttpMethod, HttpRequest, HttpResponse, PublicHttpUrl, RequestBody, RequestOptions};
import edk.http.url.parse_public_url;

public alias HttpError = {
    kind: string,
    message: string,
};

flow raise_http_error(error: HttpError) -> never ![Error<HttpError>] {
    return perform Error<HttpError>.raise(error);
}

flow ensure_preflight(method: HttpMethod, host: string, request: HttpRequest) -> unit ![Error<HttpError>] {
    let preflight = preflight_request(method, host, request);
    if !preflight.ok {
        raise_http_error(preflight.error);
    }
    return;
}

flow parse_request_url(value: string) -> PublicHttpUrl ![Error<HttpError>] {
    return match parse_public_url(value) {
        Ok(url) => url,
        Err(error) => raise_http_error(error),
    };
}

let EdkHttpApiDefault: ![EdkHttp => Error<HttpError> for HttpActionResponse] = handler {
    EdkHttp.request(request) => {
        let internal = raise_request(request);
        let method = internal.method;
        let host = internal.url.host;
        resume lower_response(execute_request(method, host, internal));
    }
};

flow request(req: HttpRequest) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    let normalized = normalize_request(req);
    ensure_preflight(normalized.method, normalized.url.host, normalized);
    let response = perform EdkHttp.request(lower_request(normalized)) with EdkHttpApiDefault;
    return raise_response(response);
}

public flow get(url: string, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return get_url(parse_request_url(url), options);
}

public flow post(url: string, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return post_url(parse_request_url(url), body, options);
}

public flow put(url: string, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return put_url(parse_request_url(url), body, options);
}

public flow patch(url: string, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return patch_url(parse_request_url(url), body, options);
}

public flow delete(url: string, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return delete_url(parse_request_url(url), options);
}

public flow head(url: string, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return head_url(parse_request_url(url), options);
}

public flow get_url(url: PublicHttpUrl, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return request(request_with_options(get_method(), url, options));
}

public flow post_url(url: PublicHttpUrl, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return request(request_with_body_options(post_method(), url, body, options));
}

public flow put_url(url: PublicHttpUrl, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return request(request_with_body_options(put_method(), url, body, options));
}

public flow patch_url(url: PublicHttpUrl, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return request(request_with_body_options(patch_method(), url, body, options));
}

public flow delete_url(url: PublicHttpUrl, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return request(request_with_options(delete_method(), url, options));
}

public flow head_url(url: PublicHttpUrl, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return request(request_with_options(head_method(), url, options));
}

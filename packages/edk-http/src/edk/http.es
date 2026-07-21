module edk.http;

import edk.http.api.{delete as api_delete, delete_url as api_delete_url, get as api_get, get_url as api_get_url, head as api_head, head_url as api_head_url, patch as api_patch, patch_url as api_patch_url, post as api_post, post_url as api_post_url, put as api_put, put_url as api_put_url};
import edk.http.policy.EdkHttp;
import edk.http.types.{HttpResponse, PublicHttpUrl, RequestBody, RequestOptions};

public alias HttpError = {
    kind: string,
    message: string,
};

public flow get(url: string, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_get(url, options);
}

public flow post(url: string, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_post(url, body, options);
}

public flow put(url: string, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_put(url, body, options);
}

public flow patch(url: string, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_patch(url, body, options);
}

public flow delete(url: string, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_delete(url, options);
}

public flow head(url: string, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_head(url, options);
}

public flow get_url(url: PublicHttpUrl, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_get_url(url, options);
}

public flow post_url(url: PublicHttpUrl, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_post_url(url, body, options);
}

public flow put_url(url: PublicHttpUrl, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_put_url(url, body, options);
}

public flow patch_url(url: PublicHttpUrl, body: RequestBody, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_patch_url(url, body, options);
}

public flow delete_url(url: PublicHttpUrl, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_delete_url(url, options);
}

public flow head_url(url: PublicHttpUrl, options: RequestOptions) -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_head_url(url, options);
}

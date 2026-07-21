module edk.http.client.defaults;

import edk.http.body.empty;
import edk.http.headers.{empty_headers, header, header_value, set, user_header_name};
import edk.http.errors.HttpError;
import edk.http.pure.method.normalize_http_method;
import edk.http.types.{AuthConfig, BodyLimit, CookiePolicy, HeaderValue, HttpClient, HttpClientConfig, HttpMethod, HttpRequest, ProxyConfig, PublicHttpUrl, RedirectPolicy, RequestBody, RequestOptions, RetryPolicy, Timeout, TlsPolicy, Url, UserHeaderName};
import edk.http.url.public_url_value;

public flow timeout_millis(millis: i32) -> Timeout ![] {
    return Timeout { millis = millis };
}

public flow default_timeout() -> Timeout ![] {
    return timeout_millis(30000);
}

public flow body_limit_bytes(max_bytes: usize) -> BodyLimit ![] {
    return BodyLimit { max_bytes = max_bytes };
}

public flow default_body_limit() -> BodyLimit ![] {
    return body_limit_bytes(1048576);
}

public flow default_redirect_policy() -> RedirectPolicy ![] {
    return RedirectPolicy { follow = true, max_hops = 5 };
}

public flow no_redirects() -> RedirectPolicy ![] {
    return RedirectPolicy { follow = false, max_hops = 0 };
}

public flow default_retry_policy() -> RetryPolicy ![] {
    return RetryPolicy { max_attempts = 1, backoff_millis = 0 };
}

public flow no_retries() -> RetryPolicy ![] {
    return RetryPolicy { max_attempts = 1, backoff_millis = 0 };
}

public flow default_tls_policy() -> TlsPolicy ![] {
    return TlsPolicy { verify_peer = true, min_version = "1.2" };
}

public flow no_proxy() -> ProxyConfig ![] {
    return ProxyConfig {
        enabled = false,
        url = Url { scheme = "", host = "", port = 0, path_and_query = "" },
    };
}

public flow no_auth() -> AuthConfig ![] {
    return AuthConfig { kind = "none", token_ref = "" };
}

public flow default_cookie_policy() -> CookiePolicy ![] {
    return CookiePolicy { enabled = false, store = "" };
}

public flow default_config() -> HttpClientConfig ![] {
    return HttpClientConfig {
        timeout = default_timeout(),
        body_limit = default_body_limit(),
        retry = default_retry_policy(),
        tls = default_tls_policy(),
        proxy = no_proxy(),
        auth = no_auth(),
        cookie = default_cookie_policy(),
        redirect = default_redirect_policy(),
    };
}

public flow default_options() -> RequestOptions ![] {
    let config = default_config();
    return RequestOptions {
        timeout = config.timeout,
        body_limit = config.body_limit,
        retry = config.retry,
        redirect = config.redirect,
    };
}

public flow default_client() -> HttpClient ![] {
    return HttpClient { config = default_config() };
}

public flow apply_options(request: HttpRequest, options: RequestOptions) -> HttpRequest ![] {
    return HttpRequest {
        method = normalize_http_method(request.method),
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = options.timeout,
        body_limit = options.body_limit,
        retry = options.retry,
        redirect = options.redirect,
    };
}

public flow apply_client_config(client: HttpClient, request: HttpRequest) -> HttpRequest ![] {
    return HttpRequest {
        method = normalize_http_method(request.method),
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = client.config.timeout,
        body_limit = client.config.body_limit,
        retry = client.config.retry,
        redirect = client.config.redirect,
    };
}

public flow normalize_request(request: HttpRequest) -> HttpRequest ![] {
    return HttpRequest {
        method = normalize_http_method(request.method),
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
}

public flow request_with_options(method: HttpMethod, url: PublicHttpUrl, options: RequestOptions) -> HttpRequest ![] {
    return HttpRequest {
        method = normalize_http_method(method),
        url = public_url_value(url),
        headers = empty_headers(),
        body = empty(),
        timeout = options.timeout,
        body_limit = options.body_limit,
        retry = options.retry,
        redirect = options.redirect,
    };
}

public flow default_request(method: HttpMethod, url: PublicHttpUrl) -> HttpRequest ![] {
    let config = default_config();
    return HttpRequest {
        method = normalize_http_method(method),
        url = public_url_value(url),
        headers = empty_headers(),
        body = empty(),
        timeout = config.timeout,
        body_limit = config.body_limit,
        retry = config.retry,
        redirect = config.redirect,
    };
}

public flow request_with_body_options(method: HttpMethod, url: PublicHttpUrl, body: RequestBody, options: RequestOptions) -> HttpRequest ![] {
    return HttpRequest {
        method = normalize_http_method(method),
        url = public_url_value(url),
        headers = empty_headers(),
        body = body,
        timeout = options.timeout,
        body_limit = options.body_limit,
        retry = options.retry,
        redirect = options.redirect,
    };
}

public flow request_with_body(method: HttpMethod, url: PublicHttpUrl, body: RequestBody) -> HttpRequest ![] {
    let config = default_config();
    return HttpRequest {
        method = normalize_http_method(method),
        url = public_url_value(url),
        headers = empty_headers(),
        body = body,
        timeout = config.timeout,
        body_limit = config.body_limit,
        retry = config.retry,
        redirect = config.redirect,
    };
}

public flow with_header(request: HttpRequest, name: UserHeaderName, value: HeaderValue) -> HttpRequest ![] {
    return HttpRequest {
        method = request.method,
        url = request.url,
        headers = set(request.headers, header(name, value)),
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
}

public flow with_checked_header(request: HttpRequest, name: string, value: string) -> Result<HttpRequest, HttpError> ![] {
    let parsed_name = user_header_name(name);
    let parsed_value = header_value(value);
    match parsed_name {
        Err(error) => {
            return Err(error);
        }
        Ok(safe_name) => {
            match parsed_value {
                Err(error) => {
                    return Err(error);
                }
                Ok(safe_value) => {
                    return Ok(with_header(request, safe_name, safe_value));
                }
            }
        }
    }
}

public flow with_timeout(request: HttpRequest, timeout: Timeout) -> HttpRequest ![] {
    return HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
}

public flow with_body_limit(request: HttpRequest, body_limit: BodyLimit) -> HttpRequest ![] {
    return HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = body_limit,
        retry = request.retry,
        redirect = request.redirect,
    };
}

public flow with_retry_policy(request: HttpRequest, retry: RetryPolicy) -> HttpRequest ![] {
    return HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = retry,
        redirect = request.redirect,
    };
}

public flow with_redirect_policy(request: HttpRequest, redirect: RedirectPolicy) -> HttpRequest ![] {
    return HttpRequest {
        method = request.method,
        url = request.url,
        headers = request.headers,
        body = request.body,
        timeout = request.timeout,
        body_limit = request.body_limit,
        retry = request.retry,
        redirect = redirect,
    };
}

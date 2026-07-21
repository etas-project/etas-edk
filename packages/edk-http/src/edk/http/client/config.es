module edk.http.client.config;

import edk.http.types.{AuthConfig, BodyLimit, CookiePolicy, HttpClientConfig, ProxyConfig, RedirectPolicy, RetryPolicy, Timeout, TlsPolicy};

public flow client_config(
    timeout: Timeout,
    body_limit: BodyLimit,
    retry: RetryPolicy,
    tls: TlsPolicy,
    proxy: ProxyConfig,
    auth: AuthConfig,
    cookie: CookiePolicy,
    redirect: RedirectPolicy,
) -> HttpClientConfig ![] {
    return HttpClientConfig {
        timeout = timeout,
        body_limit = body_limit,
        retry = retry,
        tls = tls,
        proxy = proxy,
        auth = auth,
        cookie = cookie,
        redirect = redirect,
    };
}

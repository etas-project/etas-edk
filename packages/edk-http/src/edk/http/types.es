module edk.http.types;

public type HttpMethod = {
    value: string,
};
public alias Host = string;
public alias Port = i32;
public alias PathAndQuery = string;
public alias StatusCode = i32;

public alias HttpUrl = {
    scheme: string,
    host: Host,
    port: Port,
    path_and_query: PathAndQuery,
};

public alias Url = HttpUrl;
public type PublicHttpUrl = {
    scheme: string,
    host: Host,
    port: Port,
    path_and_query: PathAndQuery,
};

public type InternalHttpUrl = {
    scheme: string,
    host: Host,
    port: Port,
    path_and_query: PathAndQuery,
};

public spec HttpConnectTarget;
public spec PublicNetworkTarget;
public spec SupportedHttpMethod;

impl PublicHttpUrl ~ HttpConnectTarget;
impl PublicHttpUrl ~ PublicNetworkTarget;
impl InternalHttpUrl ~ HttpConnectTarget;
impl HttpMethod ~ SupportedHttpMethod;

public flow http_method_evidence(value: string) -> HttpMethod ![] {
    return HttpMethod { value = value };
}

public flow public_http_url_evidence(value: HttpUrl) -> PublicHttpUrl ![] {
    return PublicHttpUrl {
        scheme = value.scheme,
        host = value.host,
        port = value.port,
        path_and_query = value.path_and_query,
    };
}

public type HeaderName = {
    value: string,
};

public type HeaderValue = {
    value: string,
};

public type UserHeaderName = {
    value: string,
};

public type WireHeaderName = {
    value: string,
};

public spec HttpHeaderName;
public spec UserSettableHeader;

impl UserHeaderName ~ HttpHeaderName;
impl WireHeaderName ~ HttpHeaderName;
impl UserHeaderName ~ UserSettableHeader;

public flow header_name_evidence(value: string) -> HeaderName ![] {
    return HeaderName { value = value };
}

public flow header_value_evidence(value: string) -> HeaderValue ![] {
    return HeaderValue { value = value };
}

public flow user_header_name_evidence(value: string) -> UserHeaderName ![] {
    return UserHeaderName { value = header_name_evidence(value).value };
}

public flow wire_header_name_evidence(value: string) -> WireHeaderName ![] {
    return WireHeaderName { value = header_name_evidence(value).value };
}

public alias HeaderSpec<N ~ HttpHeaderName> = {
    name: N,
    value: HeaderValue,
};

public alias HeaderEvidence<N ~ HttpHeaderName> = HeaderSpec<N>;

public alias Header = HeaderEvidence<UserHeaderName>;
public alias WireHeader = HeaderEvidence<WireHeaderName>;

public alias ResponseHeader = {
    name: string,
    value: string,
};

public alias Headers = {
    entries: Array<Header>,
};

public alias ResponseHeaders = {
    entries: Array<ResponseHeader>,
};

public alias HeaderLookup = {
    found: bool,
    value: string,
};

public alias RequestBody = {
    media_type: string,
    raw: bytes,
    text: string,
    length_bytes: usize,
};

public alias ResponseBody = {
    media_type: string,
    raw: bytes,
    text: string,
};

public alias Timeout = {
    millis: i32,
};

public alias BodyLimit = {
    max_bytes: usize,
};

public alias RedirectPolicy = {
    follow: bool,
    max_hops: i32,
};

public alias RetryPolicy = {
    max_attempts: i32,
    backoff_millis: i32,
};

public alias TlsPolicy = {
    verify_peer: bool,
    min_version: string,
};

public alias ProxyConfig = {
    enabled: bool,
    url: Url,
};

public alias AuthConfig = {
    kind: string,
    token_ref: string,
};

public alias CookiePolicy = {
    enabled: bool,
    store: string,
};

public alias RequestOptions = {
    timeout: Timeout,
    body_limit: BodyLimit,
    retry: RetryPolicy,
    redirect: RedirectPolicy,
};

public alias HttpRequestScope = {
    method: HttpMethod,
    scheme: string,
    host: Host,
    port: Port,
};

public alias HttpClientConfig = {
    timeout: Timeout,
    body_limit: BodyLimit,
    retry: RetryPolicy,
    tls: TlsPolicy,
    proxy: ProxyConfig,
    auth: AuthConfig,
    cookie: CookiePolicy,
    redirect: RedirectPolicy,
};

public alias HttpClient = {
    config: HttpClientConfig,
};

public alias HttpRequest = {
    method: HttpMethod,
    url: Url,
    headers: Headers,
    body: RequestBody,
    timeout: Timeout,
    body_limit: BodyLimit,
    retry: RetryPolicy,
    redirect: RedirectPolicy,
};

public alias HttpResponse = {
    status: StatusCode,
    headers: ResponseHeaders,
    body: ResponseBody,
};

public alias UrlParseResult = {
    ok: bool,
    url: Url,
    message: string,
};

public alias EncodedRequest = {
    method: HttpMethod,
    target: PathAndQuery,
    headers: Headers,
    body: RequestBody,
    body_limit: BodyLimit,
    retry: RetryPolicy,
};

public alias DecodedResponse = {
    ok: bool,
    response: HttpResponse,
    message: string,
};

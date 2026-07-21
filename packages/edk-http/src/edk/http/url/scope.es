module edk.http.url.scope;

import std.text.starts_with;
import edk.http.pure.method.normalize_http_method;
import edk.http.types.{Host, HttpMethod, HttpRequestScope, Port, Url};
import edk.http.url.normalize.normalize_host;

public flow default_port(url: Url) -> Port ![] {
    return url.port;
}

public flow request_host_scope(url: Url) -> Host ![] {
    return url.host;
}

public flow request_scope(method: HttpMethod, url: Url) -> HttpRequestScope ![] {
    return HttpRequestScope {
        method = normalize_http_method(method),
        scheme = url.scheme,
        host = url.host,
        port = url.port,
    };
}

public flow is_private_or_reserved_host(host: Host) -> bool ![] {
    let normalized = normalize_host(host);
    return normalized == "localhost"
        || starts_with(normalized, "127.")
        || starts_with(normalized, "10.")
        || starts_with(normalized, "192.168.")
        || starts_with(normalized, "169.254.")
        || starts_with(normalized, "172.16.")
        || starts_with(normalized, "172.17.")
        || starts_with(normalized, "172.18.")
        || starts_with(normalized, "172.19.")
        || starts_with(normalized, "172.20.")
        || starts_with(normalized, "172.21.")
        || starts_with(normalized, "172.22.")
        || starts_with(normalized, "172.23.")
        || starts_with(normalized, "172.24.")
        || starts_with(normalized, "172.25.")
        || starts_with(normalized, "172.26.")
        || starts_with(normalized, "172.27.")
        || starts_with(normalized, "172.28.")
        || starts_with(normalized, "172.29.")
        || starts_with(normalized, "172.30.")
        || starts_with(normalized, "172.31.");
}

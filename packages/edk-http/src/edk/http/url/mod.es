module edk.http.url;

import edk.http.errors.{HttpError, http_error};
import edk.http.types.{Host, HttpMethod, PathAndQuery, Port, PublicHttpUrl, Url, UrlParseResult, public_http_url_evidence};
import edk.http.url.normalize.normalize_host as normalize_host_impl;
import edk.http.url.normalize.normalize_path as normalize_path_impl;
import edk.http.url.normalize.normalize_scheme as normalize_scheme_impl;
import edk.http.url.parse.parse_public_url as parse_public_url_impl;
import edk.http.url.parse.parse_url as parse_url_impl;
import edk.http.url.scope.default_port as scope_default_port;
import edk.http.url.scope.is_private_or_reserved_host as scope_is_private_or_reserved_host;
import edk.http.url.scope.request_host_scope as scope_request_host_scope;
import edk.http.url.scope.request_scope as scope_request_scope;
import edk.http.url.validate.is_supported_scheme as is_supported_scheme_impl;
import edk.http.url.validate.is_valid_host as is_valid_host_impl;
import edk.http.url.validate.is_valid_path_and_query as is_valid_path_and_query_impl;
import edk.http.url.validate.is_valid_port as is_valid_port_impl;
import edk.http.types.HttpRequestScope;

public flow normalize_scheme(scheme: string) -> string ![] {
    return normalize_scheme_impl(scheme);
}

public flow normalize_host(host: Host) -> Host ![] {
    return normalize_host_impl(host);
}

public flow normalize_path(value: string) -> PathAndQuery ![] {
    return normalize_path_impl(value);
}

public flow is_supported_scheme(scheme: string) -> bool ![] {
    return is_supported_scheme_impl(scheme);
}

public flow is_valid_host(host: Host) -> bool ![] {
    return is_valid_host_impl(host);
}

public flow is_valid_path_and_query(path_and_query: PathAndQuery) -> bool ![] {
    return is_valid_path_and_query_impl(path_and_query);
}

public flow is_valid_port(port: Port) -> bool ![] {
    return is_valid_port_impl(port);
}

public flow default_port_for_scheme(scheme: string) -> Port ![] {
    if normalize_scheme(scheme) == "http" {
        return 80;
    }
    return 443;
}

flow raw_url_with_port(scheme: string, host: Host, port: Port, path_and_query: PathAndQuery) -> Url ![] {
    return Url {
        scheme = normalize_scheme(scheme),
        host = normalize_host(host),
        port = port,
        path_and_query = normalize_path(path_and_query),
    };
}

public flow public_url_value(url: PublicHttpUrl) -> Url ![] {
    return Url {
        scheme = url.scheme,
        host = url.host,
        port = url.port,
        path_and_query = url.path_and_query,
    };
}

public flow url_with_port(scheme: string, host: Host, port: Port, path_and_query: PathAndQuery) -> Result<PublicHttpUrl, HttpError> ![] {
    let value = raw_url_with_port(scheme, host, port, path_and_query);
    if !is_supported_scheme(value.scheme) {
        return Err(http_error("invalid_url", "unsupported scheme"));
    }
    if !is_valid_host(value.host) {
        return Err(http_error("invalid_url", "invalid host"));
    }
    if is_private_or_reserved_host(value.host) {
        return Err(http_error("private_or_reserved_host", "URL host is not public"));
    }
    if !is_valid_port(value.port) {
        return Err(http_error("invalid_url", "invalid port"));
    }
    if !is_valid_path_and_query(value.path_and_query) {
        return Err(http_error("invalid_url", "invalid path"));
    }
    return Ok(public_http_url_evidence(value));
}

public flow url(scheme: string, host: Host, path_and_query: PathAndQuery) -> Result<PublicHttpUrl, HttpError> ![] {
    return url_with_port(scheme, host, default_port_for_scheme(scheme), path_and_query);
}

public flow https(host: Host, path_and_query: PathAndQuery) -> Result<PublicHttpUrl, HttpError> ![] {
    return url("https", host, path_and_query);
}

public flow http(host: Host, path_and_query: PathAndQuery) -> Result<PublicHttpUrl, HttpError> ![] {
    return url("http", host, path_and_query);
}

public flow parse_url(input: string) -> UrlParseResult ![] {
    return parse_url_impl(input);
}

public flow parse_public_url(input: string) -> Result<PublicHttpUrl, HttpError> ![] {
    return parse_public_url_impl(input);
}

public flow default_port(url: Url) -> i32 ![] {
    return scope_default_port(url);
}

public flow request_host_scope(url: Url) -> Host ![] {
    return scope_request_host_scope(url);
}

public flow request_scope(method: HttpMethod, url: Url) -> HttpRequestScope ![] {
    return scope_request_scope(method, url);
}

public flow is_private_or_reserved_host(host: Host) -> bool ![] {
    return scope_is_private_or_reserved_host(host);
}

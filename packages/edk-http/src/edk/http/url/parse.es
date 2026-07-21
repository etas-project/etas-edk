module edk.http.url.parse;

import std.text.{join, len as text_len, parse_i32, split, trim};
import edk.http.errors.{HttpError, http_error};
import edk.http.types.{PathAndQuery, Port, PublicHttpUrl, Url, UrlParseResult, public_http_url_evidence};
import edk.http.url.normalize.{append_query, normalize_host, normalize_path, normalize_scheme};
import edk.http.url.scope.is_private_or_reserved_host;
import edk.http.url.validate.{is_supported_scheme, is_valid_host, is_valid_path_and_query};

type StringPart = {
    found: bool,
    value: string,
};

flow count_strings(values: Array<string>) -> i32 ![] {
    var total = 0;
    for value in values limit Iterations(65536) {
        total = total + 1;
    };
    return total;
}

flow string_at(values: Array<string>, target: i32) -> StringPart ![] {
    var index = 0;
    for value in values limit Iterations(65536) {
        if index == target {
            return StringPart { found = true, value = value };
        }
        index = index + 1;
    }
    return StringPart { found = false, value = "" };
}

flow join_path_tail(parts: Array<string>) -> PathAndQuery ![] {
    var tail: Array<string> = [];
    var index = 0;
    for value in parts limit Iterations(4096) {
        if index > 0 {
            tail = tail.push(value);
        }
        index = index + 1;
    }

    if count_strings(tail) == 0 {
        return "/";
    }
    return join(["", join(tail, "/")], "/");
}

flow join_tail(parts: Array<string>, delimiter: string) -> string ![] {
    var tail: Array<string> = [];
    var index = 0;
    for value in parts limit Iterations(4096) {
        if index > 0 {
            tail = tail.push(value);
        }
        index = index + 1;
    }
    return join(tail, delimiter);
}

flow empty_url() -> Url ![] {
    return Url { scheme = "", host = "", port = 0, path_and_query = "" };
}

flow partial_url(scheme: string, host: string, port: Port, path_and_query: string) -> Url ![] {
    return Url { scheme = scheme, host = host, port = port, path_and_query = path_and_query };
}

flow default_port_for_scheme(scheme: string) -> Port ![] {
    if scheme == "http" {
        return 80;
    }
    return 443;
}

flow remove_text(value: string, needle: string) -> string ![] {
    return join(split(value, needle), "");
}

flow strip_decimal_digits(value: string) -> string ![] {
    var out = value;
    out = remove_text(out, "0");
    out = remove_text(out, "1");
    out = remove_text(out, "2");
    out = remove_text(out, "3");
    out = remove_text(out, "4");
    out = remove_text(out, "5");
    out = remove_text(out, "6");
    out = remove_text(out, "7");
    out = remove_text(out, "8");
    out = remove_text(out, "9");
    return out;
}

flow is_decimal_port_text(value: string) -> bool ![] {
    return value != "" && text_len(value) <= 5 && strip_decimal_digits(value) == "";
}

flow is_valid_port(port: Port) -> bool ![] {
    return port > 0 && port <= 65535;
}

public flow parse_url(input: string) -> UrlParseResult ![] {
    let normalized = trim(input);
    let scheme_parts = split(normalized, "://");
    if count_strings(scheme_parts) < 2 {
        return UrlParseResult {
            ok = false,
            url = empty_url(),
            message = "missing scheme separator",
        };
    }

    let scheme = normalize_scheme(string_at(scheme_parts, 0).value);
    if !is_supported_scheme(scheme) {
        return UrlParseResult {
            ok = false,
            url = partial_url(scheme, "", 0, ""),
            message = "unsupported scheme",
        };
    }

    let rest = join_tail(scheme_parts, "://");
    let query_parts = split(rest, "?");
    let before_query = string_at(query_parts, 0).value;
    let query = join_tail(query_parts, "?");
    let rest_parts = split(before_query, "/");
    let authority_parts = split(string_at(rest_parts, 0).value, ":");
    if count_strings(authority_parts) > 2 {
        return UrlParseResult {
            ok = false,
            url = partial_url(scheme, "", 0, ""),
            message = "invalid host",
        };
    }
    let host = normalize_host(string_at(authority_parts, 0).value);
    if host == "" {
        return UrlParseResult {
            ok = false,
            url = partial_url(scheme, "", 0, ""),
            message = "missing host",
        };
    }
    if !is_valid_host(host) {
        return UrlParseResult {
            ok = false,
            url = partial_url(scheme, "", 0, ""),
            message = "invalid host",
        };
    }

    var port = default_port_for_scheme(scheme);
    if count_strings(authority_parts) == 2 {
        let port_text = trim(string_at(authority_parts, 1).value);
        if port_text == "" {
            return UrlParseResult {
                ok = false,
                url = partial_url(scheme, host, 0, ""),
                message = "invalid port",
            };
        }
        if !is_decimal_port_text(port_text) {
            return UrlParseResult {
                ok = false,
                url = partial_url(scheme, host, 0, ""),
                message = "invalid port",
            };
        }
        match parse_i32(port_text) {
            Ok(parsed_port) => {
                port = parsed_port;
            }
            Err(_) => {
                return UrlParseResult {
                    ok = false,
                    url = partial_url(scheme, host, 0, ""),
                    message = "invalid port",
                };
            }
        }
        if !is_valid_port(port) {
            return UrlParseResult {
                ok = false,
                url = partial_url(scheme, host, port, ""),
                message = "invalid port",
            };
        }
    }

    let path_and_query = append_query(join_path_tail(rest_parts), query);
    if !is_valid_path_and_query(path_and_query) {
        return UrlParseResult {
            ok = false,
            url = partial_url(scheme, host, port, ""),
            message = "invalid path",
        };
    }

    return UrlParseResult {
        ok = true,
        url = Url {
            scheme = scheme,
            host = host,
            port = port,
            path_and_query = path_and_query,
        },
        message = "",
    };
}

public flow parse_absolute_url(input: string) -> UrlParseResult ![] {
    return parse_url(input);
}

public flow parse_public_url(input: string) -> Result<PublicHttpUrl, HttpError> ![] {
    let parsed = parse_url(input);
    if !parsed.ok {
        return Err(http_error("invalid_url", parsed.message));
    }
    if is_private_or_reserved_host(parsed.url.host) {
        return Err(http_error("private_or_reserved_host", "URL host is not public"));
    }
    return Ok(public_http_url_evidence(parsed.url));
}

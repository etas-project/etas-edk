module edk.http.url.validate;

import std.text.{contains, split, starts_with};
import edk.http.types.{Host, PathAndQuery, Port};
import edk.http.url.normalize.{normalize_host, normalize_path, normalize_scheme};

flow ends_with_text(value: string, suffix: string) -> bool ![] {
    if suffix == "" {
        return true;
    }
    if !contains(value, suffix) {
        return false;
    }
    var last = value;
    for part in split(value, suffix) limit Iterations(65536) {
        last = part;
    }
    return last == "";
}

flow is_safe_host_label(label: string) -> bool ![] {
    return label != ""
        && !starts_with(label, "-")
        && !ends_with_text(label, "-")
        && !contains(label, "_");
}

public flow is_supported_scheme(scheme: string) -> bool ![] {
    let normalized = normalize_scheme(scheme);
    return normalized == "http" || normalized == "https";
}

public flow is_valid_host(host: Host) -> bool ![] {
    let normalized = normalize_host(host);
    if normalized == "" || starts_with(normalized, ".") || ends_with_text(normalized, ".") {
        return false;
    }
    if contains(normalized, " ")
        || contains(normalized, "@")
        || contains(normalized, ":")
        || contains(normalized, "\\")
        || contains(normalized, "/")
        || contains(normalized, "?")
        || contains(normalized, "#")
        || contains(normalized, "..")
        || contains(normalized, "\t")
        || contains(normalized, "\n")
        || contains(normalized, "\r")
    {
        return false;
    }
    for label in split(normalized, ".") limit Iterations(128) {
        if !is_safe_host_label(label) {
            return false;
        }
    }
    return true;
}

public flow is_valid_path_and_query(path_and_query: PathAndQuery) -> bool ![] {
    let normalized = normalize_path(path_and_query);
    if contains(normalized, "\\")
        || contains(normalized, "#")
        || contains(normalized, " ")
        || contains(normalized, "\t")
        || contains(normalized, "\n")
        || contains(normalized, "\r")
    {
        return false;
    }
    return true;
}

public flow is_valid_port(port: Port) -> bool ![] {
    return port > 0 && port <= 65535;
}

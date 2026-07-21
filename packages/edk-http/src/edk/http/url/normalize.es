module edk.http.url.normalize;

import std.text.{join, lowercase, starts_with, trim};
import edk.http.types.{Host, PathAndQuery};

public flow normalize_scheme(scheme: string) -> string ![] {
    return lowercase(trim(scheme));
}

public flow normalize_host(host: Host) -> Host ![] {
    return lowercase(trim(host));
}

public flow normalize_path(value: string) -> PathAndQuery ![] {
    let trimmed = trim(value);
    if trimmed == "" {
        return "/";
    }
    if starts_with(trimmed, "/") {
        return trimmed;
    }
    return join(["", trimmed], "/");
}

public flow append_query(path: PathAndQuery, query: string) -> PathAndQuery ![] {
    if query == "" {
        return path;
    }
    return join([path, "?", query], "");
}

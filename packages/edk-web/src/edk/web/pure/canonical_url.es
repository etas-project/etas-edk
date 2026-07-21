module edk.web.pure.canonical_url;

import std.text.split;
import edk.http.types.Url;

flow strip_fragment(path_and_query: string) -> string ![] {
    var value = "";
    var first = true;
    for part in split(path_and_query, "#") limit Iterations(1024) {
        if first {
            value = part;
            first = false;
        }
    }
    return value;
}

public flow canonical(url_value: Url) -> Url ![] {
    return Url {
        scheme = url_value.scheme,
        host = url_value.host,
        port = url_value.port,
        path_and_query = strip_fragment(url_value.path_and_query),
    };
}

public flow same_origin(left: Url, right: Url) -> bool ![] {
    let normalized_left = canonical(left);
    let normalized_right = canonical(right);
    if normalized_left.scheme != normalized_right.scheme {
        return false;
    }
    return normalized_left.host == normalized_right.host;
}

public flow same_domain(left: Url, right: Url) -> bool ![] {
    let normalized_left = canonical(left);
    let normalized_right = canonical(right);
    return normalized_left.host == normalized_right.host;
}

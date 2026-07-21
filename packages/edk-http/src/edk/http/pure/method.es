module edk.http.pure.method;

import std.text.{trim, uppercase};
import edk.http.errors.{HttpError, http_error};
import edk.http.types.{HttpMethod, http_method_evidence};

public flow normalize_method(method: string) -> string ![] {
    return uppercase(trim(method));
}

public flow is_supported_method(method: string) -> bool ![] {
    let normalized = normalize_method(method);
    return normalized == "GET"
        || normalized == "POST"
        || normalized == "PUT"
        || normalized == "PATCH"
        || normalized == "DELETE"
        || normalized == "HEAD"
        || normalized == "OPTIONS";
}

flow method_ref(value: string) -> HttpMethod ![] {
    return http_method_evidence(value);
}

public flow http_method_value(method: HttpMethod) -> string ![] {
    return method.value;
}

public flow http_method(value: string) -> Result<HttpMethod, HttpError> ![] {
    let normalized = normalize_method(value);
    if !is_supported_method(normalized) {
        return Err(http_error("invalid_method", "unsupported HTTP method"));
    }
    return Ok(method_ref(normalized));
}

public flow normalize_http_method(method: HttpMethod) -> HttpMethod ![] {
    return method_ref(normalize_method(http_method_value(method)));
}

public flow get_method() -> HttpMethod ![] {
    return method_ref("GET");
}

public flow post_method() -> HttpMethod ![] {
    return method_ref("POST");
}

public flow put_method() -> HttpMethod ![] {
    return method_ref("PUT");
}

public flow patch_method() -> HttpMethod ![] {
    return method_ref("PATCH");
}

public flow delete_method() -> HttpMethod ![] {
    return method_ref("DELETE");
}

public flow head_method() -> HttpMethod ![] {
    return method_ref("HEAD");
}

public flow options_method() -> HttpMethod ![] {
    return method_ref("OPTIONS");
}

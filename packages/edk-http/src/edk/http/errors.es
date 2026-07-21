module edk.http.errors;

import edk.http.types.StatusCode;

public alias HttpError = {
    kind: string,
    message: string,
};

public type UrlParseError = {
    input: string,
    message: string,
};

public type HeaderError = {
    name: string,
    message: string,
};

public type TransportError = {
    host: string,
    message: string,
};

public type TlsError = {
    host: string,
    message: string,
};

public type TimeoutError = {
    millis: i32,
    message: string,
};

public type RedirectError = {
    hops: i32,
    message: string,
};

public type StatusError = {
    status: StatusCode,
    message: string,
};

public type BodyLimitError = {
    max_bytes: usize,
    actual_bytes: usize,
    message: string,
};

public type CodecError = {
    phase: string,
    message: string,
};

public type PolicyScopeError = {
    method: string,
    host: string,
    message: string,
};

public flow http_error(kind: string, message: string) -> HttpError ![] {
    return HttpError {
        kind = kind,
        message = message,
    };
}

public flow codec_error(message: string) -> HttpError ![] {
    return http_error("codec", message);
}

public flow network_transport_error(message: string) -> HttpError ![] {
    return http_error("network", message);
}

public flow tls_transport_error(message: string) -> HttpError ![] {
    return http_error("tls", message);
}

public flow stream_transport_error(message: string) -> HttpError ![] {
    return http_error("stream", message);
}

public flow response_body_read_error(message: string) -> HttpError ![] {
    return http_error("response_body_read", message);
}

public flow response_body_limit_error(message: string) -> HttpError ![] {
    return http_error("response_body_limit", message);
}

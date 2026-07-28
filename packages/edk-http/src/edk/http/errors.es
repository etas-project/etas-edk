module edk.http.errors;

import std.text.join;
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

public flow response_body_limit_error(message: string) -> HttpError ![] {
    return http_error("response_body_limit", message);
}

public flow stream_timeout_for_phase(phase: string) -> HttpError ![] {
    return http_error("timeout", join([phase, " timed out"], ""));
}

public flow stream_cancelled_for_phase(phase: string) -> HttpError ![] {
    return http_error("cancelled", join([phase, " cancelled"], ""));
}

public flow stream_closed_for_phase(phase: string) -> HttpError ![] {
    return http_error("closed", join([phase, " failed: stream closed"], ""));
}

public flow stream_interrupted_for_phase(phase: string) -> HttpError ![] {
    return http_error("interrupted", join([phase, " interrupted"], ""));
}

public flow stream_limit_for_phase(phase: string) -> HttpError ![] {
    return response_body_limit_error(join([phase, " limit exceeded"], ""));
}

public flow stream_host_for_phase(phase: string) -> HttpError ![] {
    return stream_transport_error(join([phase, " failed"], ""));
}

module edk.email.smtp;

import std.text.{contains, split, starts_with, trim};
import edk.email.errors.SmtpError;
import edk.email.types.{SmtpEndpoint, TlsSmtpEndpoint};

flow raw_smtp_endpoint(host: string, port: i32, tls: bool) -> SmtpEndpoint ![] {
    return SmtpEndpoint {
        host = trim(host),
        port = port,
        tls = tls,
    };
}

flow raw_tls_smtp_endpoint(endpoint: SmtpEndpoint) -> TlsSmtpEndpoint ![] {
    return TlsSmtpEndpoint {
        host = endpoint.host,
        port = endpoint.port,
        tls = endpoint.tls,
    };
}

public flow smtp_endpoint_value(endpoint: TlsSmtpEndpoint) -> SmtpEndpoint ![] {
    return SmtpEndpoint {
        host = endpoint.host,
        port = endpoint.port,
        tls = endpoint.tls,
    };
}

flow smtp_error(host: string, message: string) -> SmtpError ![] {
    return SmtpError {
        host = host,
        message = message,
    };
}

public flow smtp_endpoint(host: string, port: i32, tls: bool) -> Result<TlsSmtpEndpoint, SmtpError> ![] {
    let endpoint = raw_smtp_endpoint(host, port, tls);
    if !is_valid_smtp_endpoint_value(endpoint) {
        return Err(smtp_error(host, "invalid TLS SMTP endpoint"));
    }
    return Ok(raw_tls_smtp_endpoint(endpoint));
}

public flow default_submission_endpoint(host: string) -> Result<TlsSmtpEndpoint, SmtpError> ![] {
    return smtp_endpoint(host, 587, true);
}

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

flow is_safe_smtp_host(host: string) -> bool ![] {
    let normalized = trim(host);
    if normalized == "" || starts_with(normalized, ".") || ends_with_text(normalized, ".") {
        return false;
    }
    if contains(normalized, " ")
        || contains(normalized, "/")
        || contains(normalized, "\\")
        || contains(normalized, ":")
        || contains(normalized, "?")
        || contains(normalized, "#")
        || contains(normalized, "@")
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

flow is_valid_smtp_endpoint_value(endpoint: SmtpEndpoint) -> bool ![] {
    return is_safe_smtp_host(endpoint.host)
        && endpoint.port > 0
        && endpoint.port <= 65535
        && endpoint.tls;
}

public flow is_valid_smtp_endpoint(endpoint: TlsSmtpEndpoint) -> bool ![] {
    return is_valid_smtp_endpoint_value(smtp_endpoint_value(endpoint));
}

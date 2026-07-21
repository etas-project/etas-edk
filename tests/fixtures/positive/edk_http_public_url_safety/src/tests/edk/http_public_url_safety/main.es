module tests.edk.http_public_url_safety.main;

import edk.http.get_url;
import edk.http.client.defaults.default_options;
import edk.http.errors.HttpError;
import edk.http.headers.parse_header;
import edk.http.types.{HttpResponse, PublicHttpUrl};
import edk.http.url.parse_public_url;

flow checked_public_url(value: string) -> PublicHttpUrl ![Error<HttpError>] {
    return match parse_public_url(value) {
        Ok(url) => url,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow can_call_http_with_public_url() -> HttpResponse ![Error<HttpError>] {
    return get_url(checked_public_url("https://example.com/status"), default_options());
}

flow rejects_private_host() -> bool ![] {
    return match parse_public_url("http://127.0.0.1/status") {
        Ok(url) => false,
        Err(error) => error.kind == "private_or_reserved_host",
    };
}

flow rejects_managed_header() -> bool ![] {
    return match parse_header("Host", "evil.example") {
        Ok(header) => false,
        Err(error) => error.kind == "managed_header",
    };
}

flow main(args: Array<string>) -> i32 ![] {
    if !rejects_private_host() {
        return 1;
    }
    if !rejects_managed_header() {
        return 1;
    }
    return 0;
}

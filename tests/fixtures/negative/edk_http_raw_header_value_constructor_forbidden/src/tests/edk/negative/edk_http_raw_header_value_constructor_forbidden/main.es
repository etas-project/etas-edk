module tests.edk.negative.edk_http_raw_header_value_constructor_forbidden.main;

import edk.http.errors.HttpError;
import edk.http.headers.{append, empty_headers, header, user_header_name};
import edk.http.types.{HeaderValue, UserHeaderName};

flow checked_header_name(value: string) -> UserHeaderName ![Error<HttpError>] {
    return match user_header_name(value) {
        Ok(name) => name,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<HttpError>] {
    let name = checked_header_name("x-safe");
    let item = header(name, HeaderValue("ok\r\nInjected: bad"));
    let headers = append(empty_headers(), item);
    return 0;
}

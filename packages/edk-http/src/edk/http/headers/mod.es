module edk.http.headers;

import std.text.{lowercase, trim};
import edk.http.headers.build.empty_headers as build_empty_headers;
import edk.http.headers.build.append as build_append;
import edk.http.headers.build.set as build_set;
import edk.http.headers.build.single as build_single;
import edk.http.headers.build.count as build_count;
import edk.http.headers.build.find as build_find;
import edk.http.headers.build.find_response as build_find_response;
import edk.http.headers.build.header_name as build_header_name;
import edk.http.headers.build.header_value as build_header_value;
import edk.http.headers.build.can_user_set_header as build_can_user_set_header;
import edk.http.headers.build.is_managed_header_name as build_is_managed_header_name;
import edk.http.errors.{HttpError, http_error};
import edk.http.headers.validate.is_valid_header_name as validate_header_name;
import edk.http.headers.validate.is_valid_header_value as validate_header_value;
import edk.http.types.{Header, HeaderLookup, HeaderName, HeaderSpec, HeaderValue, Headers, ResponseHeaders, UserHeaderName, header_value_evidence, user_header_name_evidence};

public flow empty_headers() -> Headers ![] {
    return build_empty_headers();
}

public flow user_header_name(name: string) -> Result<UserHeaderName, HttpError> ![] {
    if !validate_header_name(name) {
        return Err(http_error("invalid_header_name", "invalid HTTP header name"));
    }
    if build_is_managed_header_name(name) {
        return Err(http_error("managed_header", "managed HTTP header cannot be user-set"));
    }
    return Ok(user_header_name_evidence(lowercase(trim(name))));
}

public flow header_value(value: string) -> Result<HeaderValue, HttpError> ![] {
    if !validate_header_value(value) {
        return Err(http_error("invalid_header_value", "invalid HTTP header value"));
    }
    return Ok(header_value_evidence(trim(value)));
}

flow raw_header_spec(name: UserHeaderName, value: HeaderValue) -> HeaderSpec<UserHeaderName> ![] {
    return HeaderSpec<UserHeaderName> {
        name = name,
        value = value,
    };
}

public flow header(name: UserHeaderName, value: HeaderValue) -> Header ![] {
    return raw_header_spec(name, value);
}

public flow header_name(item: Header) -> UserHeaderName ![] {
    return build_header_name(item);
}

public flow header_value_evidence(item: Header) -> HeaderValue ![] {
    return build_header_value(item);
}

public flow parse_header(name: string, value: string) -> Result<Header, HttpError> ![] {
    let parsed_name = user_header_name(name);
    let parsed_value = header_value(value);
    match parsed_name {
        Err(error) => {
            return Err(error);
        }
        Ok(safe_name) => {
            match parsed_value {
                Err(error) => {
                    return Err(error);
                }
                Ok(safe_value) => {
                    return Ok(header(safe_name, safe_value));
                }
            }
        }
    }
}

public flow append(headers: Headers, item: Header) -> Headers ![] {
    return build_append(headers, item);
}

public flow set(headers: Headers, item: Header) -> Headers ![] {
    return build_set(headers, item);
}

public flow single(name: UserHeaderName, value: HeaderValue) -> Headers ![] {
    return build_single(name, value);
}

public flow single_checked(name: string, value: string) -> Result<Headers, HttpError> ![] {
    let parsed = parse_header(name, value);
    match parsed {
        Err(error) => {
            return Err(error);
        }
        Ok(item) => {
            return Ok(append(empty_headers(), item));
        }
    }
}

public flow count(headers: Headers) -> i32 ![] {
    return build_count(headers);
}

public flow find(headers: Headers, name: string) -> HeaderLookup ![] {
    return build_find(headers, name);
}

public flow find_response(headers: ResponseHeaders, name: string) -> HeaderLookup ![] {
    return build_find_response(headers, name);
}

public flow is_managed_header_name(name: string) -> bool ![] {
    return build_is_managed_header_name(name);
}

public flow can_user_set_header(name: string, value: string) -> bool ![] {
    return build_can_user_set_header(name, value);
}

public flow is_valid_header_name(name: string) -> bool ![] {
    return validate_header_name(name);
}

public flow is_valid_header_value(value: string) -> bool ![] {
    return validate_header_value(value);
}

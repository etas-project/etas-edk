module edk.http.headers.build;

import std.text.{lowercase, trim};
import edk.http.headers.validate.{is_valid_header_name, is_valid_header_value};
import edk.http.types.{Header, HeaderLookup, HeaderName, HeaderSpec, HeaderValue, Headers, ResponseHeaders, UserHeaderName};

public flow empty_headers() -> Headers ![] {
    let entries: Array<Header> = [];
    return Headers { entries = entries };
}

public flow append(headers: Headers, item: Header) -> Headers ![] {
    return Headers { entries = headers.entries.push(item) };
}

public flow set(headers: Headers, item: Header) -> Headers ![] {
    var entries: Array<Header> = [];
    for existing in headers.entries limit Iterations(65536) {
        if user_header_name_value(header_name(existing)) != user_header_name_value(header_name(item)) {
            entries = entries.push(existing);
        }
    }
    return Headers { entries = entries.push(item) };
}

public flow is_managed_header_name(name: string) -> bool ![] {
    let normalized = lowercase(trim(name));
    return normalized == "host" || normalized == "content-length" || normalized == "connection";
}

public flow can_user_set_header(name: string, value: string) -> bool ![] {
    return is_valid_header_name(name)
        && is_valid_header_value(value)
        && !is_managed_header_name(name);
}

flow raw_header_value(value: HeaderValue) -> string ![] {
    return value.value;
}

public flow header_value_text(value: HeaderValue) -> string ![] {
    return raw_header_value(value);
}

public flow user_header_name_value(name: UserHeaderName) -> string ![] {
    return name.value;
}

flow raw_header_spec(name: UserHeaderName, value: HeaderValue) -> HeaderSpec<UserHeaderName> ![] {
    return HeaderSpec<UserHeaderName> {
        name = name,
        value = value,
    };
}

flow trusted_header(name: UserHeaderName, value: HeaderValue) -> Header ![] {
    return raw_header_spec(name, value);
}

public flow header_name(item: Header) -> UserHeaderName ![] {
    let spec: HeaderSpec<UserHeaderName> = item;
    return spec.name;
}

public flow header_value(item: Header) -> HeaderValue ![] {
    let spec: HeaderSpec<UserHeaderName> = item;
    return spec.value;
}

public flow header_text_value(item: Header) -> string ![] {
    return header_value_text(header_value(item));
}

public flow single(name: UserHeaderName, value: HeaderValue) -> Headers ![] {
    return set(empty_headers(), trusted_header(name, value));
}

public flow count(headers: Headers) -> i32 ![] {
    var total = 0;
    for item in headers.entries limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow find(headers: Headers, name: string) -> HeaderLookup ![] {
    let wanted = lowercase(trim(name));
    for item in headers.entries limit Iterations(65536) {
        if user_header_name_value(header_name(item)) == wanted {
            return HeaderLookup { found = true, value = header_text_value(item) };
        }
    }
    return HeaderLookup { found = false, value = "" };
}

public flow find_response(headers: ResponseHeaders, name: string) -> HeaderLookup ![] {
    let wanted = lowercase(trim(name));
    for item in headers.entries limit Iterations(65536) {
        if lowercase(trim(item.name)) == wanted {
            return HeaderLookup { found = true, value = item.value };
        }
    }
    return HeaderLookup { found = false, value = "" };
}

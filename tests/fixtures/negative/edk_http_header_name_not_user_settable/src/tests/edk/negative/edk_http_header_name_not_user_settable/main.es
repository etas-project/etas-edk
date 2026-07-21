module tests.edk.negative.edk_http_header_name_not_user_settable.main;

import edk.http.types.{HeaderName, UserSettableHeader};

flow requires_user_settable_header<N ~ UserSettableHeader>(name: N) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let name = HeaderName("host");
    return requires_user_settable_header(name);
}

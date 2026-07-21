module tests.edk.negative.edk_email_raw_header_value_constructor_forbidden.main;

import edk.email.errors.EmailError;
import edk.email.message.{header, header_name};
import edk.email.types.{EmailHeaderName, EmailHeaderValue, UserEmailHeader};

flow checked_header_name(value: string) -> EmailHeaderName ![Error<EmailError>] {
    return match header_name(value) {
        Ok(name) => name,
        Err(error) => perform Error<EmailError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<EmailError>] {
    let item: UserEmailHeader = header(checked_header_name("x-safe"), EmailHeaderValue("ok\r\nInjected: bad"));
    return 0;
}

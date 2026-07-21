module tests.edk.negative.edk_email_raw_header_name_constructor_forbidden.main;

import edk.email.errors.EmailError;
import edk.email.message.{header, header_value};
import edk.email.types.{EmailHeaderName, EmailHeaderValue, UserEmailHeader};

flow checked_header_value(value: string) -> EmailHeaderValue ![Error<EmailError>] {
    return match header_value(value) {
        Ok(value) => value,
        Err(error) => perform Error<EmailError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<EmailError>] {
    let item: UserEmailHeader = header(EmailHeaderName("subject"), checked_header_value("injected"));
    return 0;
}

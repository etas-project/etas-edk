module tests.edk.negative.edk_email_raw_header_constructor_forbidden.main;

import edk.email.errors.AddressError;
import edk.email.address.parse_address;
import edk.email.message.{draft_to_one, with_header};
import edk.email.types.{EmailAddress, EmailHeader, EmailHeaderName, EmailHeaderSpec, EmailHeaderValue};

flow checked_address(value: string) -> EmailAddress ![Error<AddressError>] {
    return match parse_address(value) {
        Ok(address) => address,
        Err(error) => perform Error<AddressError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<AddressError>] {
    let recipient = checked_address("ops@example.com");
    let spec = EmailHeaderSpec<EmailHeaderName> {
        name = EmailHeaderName("subject"),
        value = EmailHeaderValue("injected"),
    };
    let header = EmailHeader<EmailHeaderName>(spec);
    let draft = with_header(draft_to_one(recipient, "Report", "ready"), header);
    return 0;
}

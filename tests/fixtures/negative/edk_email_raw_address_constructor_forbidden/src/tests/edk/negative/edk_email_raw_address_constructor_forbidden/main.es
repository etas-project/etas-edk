module tests.edk.negative.edk_email_raw_address_constructor_forbidden.main;

import edk.email.message.draft_to_one;
import edk.email.types.{EmailAddress, EmailAddressSpec};

flow main(args: Array<string>) -> i32 ![] {
    let spec = EmailAddressSpec {
        display_name = "Ops",
        address = "ops@example.com\nbcc@example.com",
        local_part = "ops",
        domain = "example.com",
    };
    let forged = EmailAddress(spec);
    let draft = draft_to_one(forged, "Report", "ready");
    return 0;
}

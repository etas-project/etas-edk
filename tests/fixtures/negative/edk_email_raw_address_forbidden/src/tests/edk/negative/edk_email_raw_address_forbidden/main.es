module tests.edk.negative.edk_email_raw_address_forbidden.main;

import edk.email.message.draft_to_one;

flow main(args: Array<string>) -> i32 ![] {
    let draft = draft_to_one("ops@example.com", "Report", "ready");
    return 0;
}

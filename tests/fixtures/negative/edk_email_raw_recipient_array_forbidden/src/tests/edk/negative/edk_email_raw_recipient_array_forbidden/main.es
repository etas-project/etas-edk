module tests.edk.negative.edk_email_raw_recipient_array_forbidden.main;

import edk.email.message.draft;

flow main(args: Array<string>) -> i32 ![] {
    let recipients: Array<string> = ["ops@example.com"];
    let item = draft(recipients, "Report", "ready");
    return 0;
}

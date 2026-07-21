module tests.edk.negative.edk_email_raw_header_forbidden.main;

import edk.email.message.header;

flow main(args: Array<string>) -> i32 ![] {
    let item = header("X-Trace", "abc");
    return 0;
}

module tests.edk.negative.edk_browser_raw_session_forbidden.main;

import edk.browser.types.BrowserSessionRef;

flow takes_session(session: BrowserSessionRef) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    return takes_session("session-1");
}

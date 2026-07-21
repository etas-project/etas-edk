module tests.edk.negative.edk_browser_raw_selector_forbidden.main;

import edk.browser.page.click;
import edk.browser.effects.EdkBrowser;
import edk.browser.errors.BrowserError;
import edk.browser.page.https;
import edk.browser.session.{browser_profile, create_session};

flow main(args: Array<string>) -> i32 ![EdkBrowser.create, Error<BrowserError>] {
    let session = create_session(browser_profile("default"), https("example.com", "/"));
    let page = click(session, "#save");
    return 0;
}

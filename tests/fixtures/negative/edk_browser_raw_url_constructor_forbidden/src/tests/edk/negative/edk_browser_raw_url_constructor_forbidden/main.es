module tests.edk.negative.edk_browser_raw_url_constructor_forbidden.main;

import edk.browser.page.empty_snapshot;
import edk.browser.types.{Url, UrlSpec};

flow main(args: Array<string>) -> i32 ![] {
    let forged = Url(UrlSpec {
        scheme = "javascript",
        host = "example.com",
        path = "alert(1)",
    });
    let snapshot = empty_snapshot(forged);
    return 0;
}

module tests.edk.negative.edk_browser_raw_selector_constructor_forbidden.main;

import edk.browser.selector.is_valid_selector;
import edk.browser.types.{Selector, SelectorSpec};

flow main(args: Array<string>) -> i32 ![] {
    let forged = Selector(SelectorSpec {
        kind = "css",
        value = "#save\nnext",
    });
    if is_valid_selector(forged) {
        return 1;
    }
    return 0;
}

module tests.edk.negative.edk_browser_raw_selector_spec_not_parsed.main;

import edk.browser.types.{ParsedSelector, SelectorSpec};

flow requires_parsed_selector<P ~ ParsedSelector>(selector: P) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let spec = SelectorSpec {
        kind = "css",
        value = "#save",
    };
    return requires_parsed_selector(spec);
}

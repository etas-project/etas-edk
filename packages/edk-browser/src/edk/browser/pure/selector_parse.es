module edk.browser.pure.selector_parse;

import edk.browser.selector.parse_selector;
import edk.browser.errors.SelectorError;
import edk.browser.types.Selector;

public flow parse(value: string) -> Result<Selector, SelectorError> ![] {
    return parse_selector(value);
}

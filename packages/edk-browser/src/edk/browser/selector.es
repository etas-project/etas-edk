module edk.browser.selector;

import std.text.{contains, split, starts_with, trim};
import edk.browser.errors.SelectorError;
import edk.browser.types.{ClickOptions, Selector, SelectorSpec};

flow selector_error(input: string, message: string) -> SelectorError ![] {
    return SelectorError {
        input = input,
        message = message,
    };
}

flow raw_css(value: string) -> SelectorSpec ![] {
    return SelectorSpec { kind = "css", value = trim(value) };
}

flow raw_text(value: string) -> SelectorSpec ![] {
    return SelectorSpec { kind = "text", value = trim(value) };
}

flow raw_selector(spec: SelectorSpec) -> Selector ![] {
    return Selector {
        kind = spec.kind,
        value = spec.value,
    };
}

public flow selector_spec(selector: Selector) -> SelectorSpec ![] {
    return SelectorSpec {
        kind = selector.kind,
        value = selector.value,
    };
}

public flow css(value: string) -> Result<Selector, SelectorError> ![] {
    let spec = raw_css(value);
    if !is_valid_selector_spec(spec) {
        return Err(selector_error(value, "invalid CSS selector"));
    }
    return Ok(raw_selector(spec));
}

public flow text(value: string) -> Result<Selector, SelectorError> ![] {
    let spec = raw_text(value);
    if !is_valid_selector_spec(spec) {
        return Err(selector_error(value, "invalid text selector"));
    }
    return Ok(raw_selector(spec));
}

public flow is_css_selector(selector: Selector) -> bool ![] {
    return selector_spec(selector).kind == "css";
}

public flow is_text_selector(selector: Selector) -> bool ![] {
    return selector_spec(selector).kind == "text";
}

public flow is_valid_selector(selector: Selector) -> bool ![] {
    return is_valid_selector_spec(selector_spec(selector));
}

public flow is_valid_selector_spec(selector: SelectorSpec) -> bool ![] {
    return (selector.kind == "css" || selector.kind == "text")
        && selector.value != ""
        && !contains(selector.value, "\n")
        && !contains(selector.value, "\r");
}

flow text_selector_value(input: string) -> string ![] {
    var index = 0;
    var value = "";
    for part in split(input, "text=") limit Iterations(4) {
        if index == 1 {
            value = part;
        }
        index = index + 1;
    }
    return trim(value);
}

public flow parse_selector(value: string) -> Result<Selector, SelectorError> ![] {
    let input = trim(value);
    if input == "" {
        return Err(selector_error(value, "empty selector"));
    }
    if contains(input, "\n") || contains(input, "\r") {
        return Err(selector_error(value, "unsafe selector"));
    }
    if starts_with(input, "text=") {
        let text_value = text_selector_value(input);
        if text_value == "" {
            return Err(selector_error(value, "empty text selector"));
        }
        return text(text_value);
    }
    return css(input);
}

public flow default_click_options() -> ClickOptions ![] {
    return ClickOptions {
        wait_after_millis = 0,
        high_impact = false,
    };
}

public flow high_impact_click_options() -> ClickOptions ![] {
    return ClickOptions {
        wait_after_millis = 0,
        high_impact = true,
    };
}

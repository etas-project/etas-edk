module edk.browser.errors;

import edk.browser.types.{BrowserSessionRef, Url};

public type BrowserError = {
    kind: string,
    message: string,
};

public type NavigationError = {
    session: BrowserSessionRef,
    url: Url,
    message: string,
};

public type SelectorError = {
    input: string,
    message: string,
};

public type TimeoutError = {
    millis: i32,
    message: string,
};

public type SessionError = {
    session: BrowserSessionRef,
    message: string,
};

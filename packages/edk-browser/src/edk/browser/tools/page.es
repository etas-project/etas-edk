module edk.browser.tools.page;

import edk.browser.effects.EdkBrowser;
import edk.browser.errors.BrowserError;
import edk.browser.page.{click, navigate, read};
import edk.browser.types.{BrowserSession, PageSnapshot, ParsedSelector, Url};

public tool open_page<S ~ BrowserSession>(session: S, url: Url) -> PageSnapshot ![EdkBrowser.navigate, Error<BrowserError>] {
    return navigate(session, url);
}

public tool click_selector<S ~ BrowserSession, P ~ ParsedSelector>(session: S, selector: P) -> PageSnapshot ![EdkBrowser.click, Error<BrowserError>] {
    return click(session, selector);
}

public tool read_page<S ~ BrowserSession>(session: S) -> PageSnapshot ![EdkBrowser.read, Error<BrowserError>] {
    return read(session);
}

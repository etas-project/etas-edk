module edk.browser.effects;

import edk.browser.types.{BrowserProfileRef, BrowserSession, BrowserSessionRef, MockBrowserSessionRef, PageSnapshot, ParsedSelector, Selector, Url};

public effect EdkBrowser extends Network {
    action create(profile: BrowserProfileRef, origin: Url) -> BrowserSessionRef;
    action attach(profile: BrowserProfileRef, origin: Url) -> BrowserSessionRef;
    action navigate<S ~ BrowserSession>(session: S, url: Url) -> PageSnapshot;
    action click<S ~ BrowserSession, P ~ ParsedSelector>(session: S, selector: P) -> PageSnapshot;
    action read<S ~ BrowserSession>(session: S) -> PageSnapshot;
}

public effect EdkBrowserMock {
    action session(id: string, origin: Url) -> MockBrowserSessionRef;
}

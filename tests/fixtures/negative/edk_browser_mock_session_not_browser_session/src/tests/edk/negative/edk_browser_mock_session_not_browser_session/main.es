module tests.edk.negative.edk_browser_mock_session_not_browser_session.main;

import edk.browser.effects.{EdkBrowser, EdkBrowserMock};
import edk.browser.errors.BrowserError;
import edk.browser.mocks.browser.mock_session;
import edk.browser.page.{https, navigate};

flow main(args: Array<string>) -> i32 ![EdkBrowserMock.session, EdkBrowser.navigate, Error<BrowserError>] {
    let session = mock_session("session-1", https("example.com", "/"));
    let page = navigate(session, https("example.com", "/status"));
    return 0;
}

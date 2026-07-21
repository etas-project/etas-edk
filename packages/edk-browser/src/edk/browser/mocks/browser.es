module edk.browser.mocks.browser;

import std.text.{contains, trim};
import edk.browser.effects.EdkBrowserMock;
import edk.browser.errors.BrowserError;
import edk.browser.page.{dom_node, is_valid_url};
import edk.browser.types.{DomNode, MockBrowserSessionRef, PageSnapshot, Url};

flow browser_error(kind: string, message: string) -> BrowserError ![] {
    return BrowserError {
        kind = kind,
        message = message,
    };
}

flow is_safe_mock_session_id(id: string) -> bool ![] {
    let session_id = trim(id);
    return session_id != ""
        && !contains(session_id, " ")
        && !contains(session_id, "/")
        && !contains(session_id, "\\")
        && !contains(session_id, ":")
        && !contains(session_id, "?")
        && !contains(session_id, "#")
        && !contains(session_id, "\t")
        && !contains(session_id, "\n")
        && !contains(session_id, "\r");
}

public flow mock_session(id: string, origin: Url) -> MockBrowserSessionRef ![EdkBrowserMock.session, Error<BrowserError>] {
    let session_id = trim(id);
    if !is_safe_mock_session_id(session_id) {
        return perform Error<BrowserError>.raise(browser_error("invalid_mock_session", "mock session id is invalid"));
    }
    if !is_valid_url(origin) {
        return perform Error<BrowserError>.raise(browser_error("invalid_mock_origin", "mock session origin is invalid"));
    }
    return perform EdkBrowserMock.session(session_id, origin);
}

public flow snapshot(url: Url, title: string, text: string) -> PageSnapshot ![] {
    let nodes: Array<DomNode> = [];
    return PageSnapshot {
        url = url,
        title = title,
        text = text,
        nodes = nodes,
    };
}

public flow snapshot_with_body(url: Url, title: string, text: string) -> PageSnapshot ![] {
    let nodes: Array<DomNode> = [dom_node("body", "", text)];
    return PageSnapshot {
        url = url,
        title = title,
        text = text,
        nodes = nodes,
    };
}

public flow snapshot_with_nodes(url: Url, title: string, text: string, nodes: Array<DomNode>) -> PageSnapshot ![] {
    return PageSnapshot {
        url = url,
        title = title,
        text = text,
        nodes = nodes,
    };
}

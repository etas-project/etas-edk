module tests.edk.browser_pure_surface.main;

import edk.browser.effects.{EdkBrowser, EdkBrowserMock};
import edk.browser.errors.{BrowserError, SelectorError};
import edk.browser.mocks.browser.{mock_session, snapshot_with_body, snapshot_with_nodes};
import edk.browser.page.{dom_node, https, is_valid_url, url, url_value};
import edk.browser.pure.dom_snapshot.{count_snapshot_nodes, snapshot_contains_text, summarize};
import edk.browser.selector.{default_click_options, high_impact_click_options, is_css_selector, is_text_selector, is_valid_selector, parse_selector, selector_spec};
import edk.browser.session.{browser_profile, create_session, default_navigation_options, is_valid_browser_profile, is_valid_navigation_options, is_valid_origin, navigation_options};
import edk.browser.screenshot.{is_supported_screenshot_media_type, is_valid_screenshot_ref, is_valid_screenshot_request, screenshot_ref, screenshot_request};
import edk.browser.types.{Selector, Url};

flow must_selector(result: Result<Selector, SelectorError>) -> Selector ![Error<SelectorError>] {
    match result {
        Ok(selector) => {
            return selector;
        }
        Err(error) => {
            return perform Error<SelectorError>.raise(error);
        }
    }
}

flow selector_ok(result: Result<Selector, SelectorError>) -> bool ![] {
    match result {
        Ok(selector) => {
            return true;
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_url(result: Result<Url, BrowserError>) -> Url ![Error<BrowserError>] {
    match result {
        Ok(value) => {
            return value;
        }
        Err(error) => {
            return perform Error<BrowserError>.raise(error);
        }
    }
}

flow url_ok(result: Result<Url, BrowserError>) -> bool ![] {
    match result {
        Ok(value) => {
            return is_valid_url(value);
        }
        Err(_) => {
            return false;
        }
    }
}

flow check_selector_and_url() -> i32 ![Error<BrowserError>, Error<SelectorError>] {
    let parsed_result = parse_selector("#submit");
    let text_selector_result = parse_selector("text=Send");
    let parsed = must_selector(parsed_result);
    let text_selector = must_selector(text_selector_result);
    let empty_text_selector = parse_selector("text=   ");
    let newline_selector = parse_selector("#submit\nnext");
    let newline_text_selector = parse_selector("text=Send\nNow");
    let empty_selector = parse_selector("");
    let target_result = https("Example.COM", "/");
    let target = must_url(target_result);
    let child_result = https("Example.COM", "docs");
    let child = must_url(child_result);
    let invalid_scheme = url("file", "example.com", "/tmp");
    let bad_host = https("bad/host", "/");
    let bad_backslash_host = https("bad\\host", "/");
    let bad_at_host = https("user@example.com", "/");
    let bad_double_dot_host = https("example..com", "/");
    let bad_leading_dot_host = https(".example.com", "/");
    let bad_trailing_dot_host = https("example.com.", "/");
    let bad_leading_hyphen_host = https("-example.com", "/");
    let bad_underscore_host = https("api_example.com", "/");
    let bad_path = https("example.com", "bad\npath");
    let bad_backslash_path = https("example.com", "bad\\path");
    let bad_embedded_url_path = https("example.com", "https://evil.example");
    let bad_space_path = https("example.com", "bad path");
    let bad_tab_path = https("example.com", "bad\tpath");
    let bad_fragment_path = https("example.com", "docs#section");

    if !selector_ok(parsed_result) { return 0; }
    if !is_css_selector(parsed) { return 0; }
    if !is_valid_selector(parsed) { return 0; }
    if !selector_ok(text_selector_result) { return 0; }
    if !is_text_selector(text_selector) { return 0; }
    if selector_spec(text_selector).value != "Send" { return 0; }
    if !is_valid_selector(text_selector) { return 0; }
    if selector_ok(empty_text_selector) { return 0; }
    if selector_ok(newline_selector) { return 0; }
    if selector_ok(newline_text_selector) { return 0; }
    if selector_ok(empty_selector) { return 0; }
    if url_value(target).host != "example.com" { return 0; }
    if url_value(child).path != "/docs" { return 0; }
    if !url_ok(target_result) { return 0; }
    if !url_ok(child_result) { return 0; }
    if url_ok(invalid_scheme) { return 0; }
    if url_ok(bad_host) { return 0; }
    if url_ok(bad_backslash_host) { return 0; }
    if url_ok(bad_at_host) { return 0; }
    if url_ok(bad_double_dot_host) { return 0; }
    if url_ok(bad_leading_dot_host) { return 0; }
    if url_ok(bad_trailing_dot_host) { return 0; }
    if url_ok(bad_leading_hyphen_host) { return 0; }
    if url_ok(bad_underscore_host) { return 0; }
    if url_ok(bad_path) { return 0; }
    if url_ok(bad_backslash_path) { return 0; }
    if url_ok(bad_embedded_url_path) { return 0; }
    if url_ok(bad_space_path) { return 0; }
    if url_ok(bad_tab_path) { return 0; }
    if url_ok(bad_fragment_path) { return 0; }
    return 1;
}

flow check_session_options() -> i32 ![EdkBrowser.create, EdkBrowserMock.session, Error<BrowserError>] {
    let profile = browser_profile("default");
    let bad_profile = browser_profile("");
    let bad_profile_path = browser_profile("team/default");
    let bad_profile_tab = browser_profile("team\tdefault");
    let target = must_url(https("example.com", "/"));
    let session = create_session(profile, target);
    let mock_handle = mock_session("session-1", target);
    let default_nav = default_navigation_options();
    let custom_nav = navigation_options(1000, "networkidle");
    let bad_timeout_nav = navigation_options(0, "load");
    let bad_wait_nav = navigation_options(1000, "idle");
    let click = default_click_options();
    let high_impact = high_impact_click_options();
    let screenshot = screenshot_request(session, "IMAGE/PNG", true);
    let bad_screenshot_media = screenshot_request(session, "text/html", false);
    let screenshot_output = screenshot_ref("shot-1", "IMAGE/WEBP");
    let empty_screenshot_output = screenshot_ref("", "image/png");
    let unsafe_screenshot_output = screenshot_ref("shots/out", "image/png");

    if profile.name != "default" { return 0; }
    if !is_valid_browser_profile(profile) { return 0; }
    if is_valid_browser_profile(bad_profile) { return 0; }
    if is_valid_browser_profile(bad_profile_path) { return 0; }
    if is_valid_browser_profile(bad_profile_tab) { return 0; }
    if !is_valid_origin("https://example.com") { return 0; }
    if !is_valid_origin("http://example.com") { return 0; }
    if is_valid_origin("https://example.com/app") { return 0; }
    if is_valid_origin("https://example.com?x=1") { return 0; }
    if is_valid_origin("file://example.com") { return 0; }
    if is_valid_origin("https://user@example.com") { return 0; }
    if is_valid_origin("https://example..com") { return 0; }
    if is_valid_origin("https://-example.com") { return 0; }
    if default_nav.timeout_millis != 30000 { return 0; }
    if custom_nav.wait_until != "networkidle" { return 0; }
    if !is_valid_navigation_options(default_nav) { return 0; }
    if !is_valid_navigation_options(custom_nav) { return 0; }
    if is_valid_navigation_options(bad_timeout_nav) { return 0; }
    if is_valid_navigation_options(bad_wait_nav) { return 0; }
    if click.high_impact { return 0; }
    if !high_impact.high_impact { return 0; }
    if screenshot.media_type != "image/png" { return 0; }
    if !screenshot.full_page { return 0; }
    if !is_valid_screenshot_request(screenshot) { return 0; }
    if is_valid_screenshot_request(bad_screenshot_media) { return 0; }
    if !is_supported_screenshot_media_type("image/jpeg") { return 0; }
    if is_supported_screenshot_media_type("image/svg+xml") { return 0; }
    if screenshot_output.media_type != "image/webp" { return 0; }
    if !is_valid_screenshot_ref(screenshot_output) { return 0; }
    if is_valid_screenshot_ref(empty_screenshot_output) { return 0; }
    if is_valid_screenshot_ref(unsafe_screenshot_output) { return 0; }
    return 1;
}

flow check_dom_and_mocks() -> i32 ![Error<BrowserError>] {
    let target = must_url(https("example.com", "/"));
    let child = must_url(https("example.com", "docs"));
    let snapshot = snapshot_with_nodes(target, "Example", "Example", [dom_node("button", "submit", "Send")]);
    let body_snapshot = snapshot_with_body(child, "Docs", "Documentation");
    let summary = summarize(snapshot);

    if summary.node_count != 1 { return 0; }
    if count_snapshot_nodes(body_snapshot) != 1 { return 0; }
    if !snapshot_contains_text(snapshot, "Send") { return 0; }
    if snapshot_contains_text(snapshot, "") { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![EdkBrowser.create, EdkBrowserMock.session, Error<BrowserError>, Error<SelectorError>] {
    if check_selector_and_url() + check_session_options() + check_dom_and_mocks() == 3 {
        return 0;
    }
    return 1;
}

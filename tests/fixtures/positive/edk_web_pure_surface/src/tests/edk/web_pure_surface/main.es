module tests.edk.web_pure_surface.main;

import edk.http.wire.decode_response.response_from_text;
import edk.http.url.{http, https};
import edk.web.crawl.{crawl_policy, empty_crawl_result, is_valid_crawl_policy};
import edk.web.fetch.{default_fetch_options, fetch_options, is_valid_fetch_options, page_from_http};
import edk.web.mocks.search_index.{count_results, count_untrusted_pages, count_untrusted_results, crawl_result, filter_results, untrusted_page};
import edk.web.pure.canonical_url.{canonical, same_domain, same_origin};
import edk.web.pure.html_extract.{extract_text, looks_like_html};
import edk.web.pure.robots.decide;
import edk.web.search.{is_valid_search_query, search_query, search_result, with_language};
import edk.web.trust.{needs_sanitization, sanitize_html};
import edk.web.types.CrawlPolicy;

flow check_pure_web() -> i32 ![] {
    let url = https("example.com", "/");
    let child = https("example.com", "docs");
    let private_page = https("example.com", "private/page");
    let private_public = https("example.com", "private/public/index.html");
    let external = https("other.example", "/");
    let insecure_same_domain = http("example.com", "/");
    let canonical_child = canonical(child);
    let fragment_child = https("Example.COM", "docs?lang=en#section");
    let canonical_fragment_child = canonical(fragment_child);
    let extracted = extract_text(" Etas ", " <html>Body</html> ");
    let robots_allow = decide(child, "User-agent: *\nAllow: /docs\nDisallow: /");
    let robots_deny = decide(child, "User-agent: *\nDisallow: /docs");
    let robots_prefix_deny = decide(private_page, "User-agent: *\nAllow: /\nDisallow: /private");
    let robots_specific_allow = decide(private_public, "User-agent: *\nDisallow: /private\nAllow: /private/public");
    let robots_case_comment = decide(private_page, "user-agent: *\ndisallow: /private # private docs");
    let robots_empty_disallow = decide(private_page, "User-agent: *\nDisallow:");
    let robots_empty_allow_deny = decide(private_page, "User-agent: *\nAllow:\nDisallow: /private");

    if extracted.title != "Etas" { return 0; }
    if !looks_like_html("TEXT/HTML", "plain") { return 0; }
    if !looks_like_html("text/plain", "<!DOCTYPE html><html>") { return 0; }
    if canonical_child.path_and_query != "/docs" { return 0; }
    if canonical_fragment_child.host != "example.com" { return 0; }
    if canonical_fragment_child.path_and_query != "/docs?lang=en" { return 0; }
    if !same_origin(url, child) { return 0; }
    if !same_origin(fragment_child, https("example.com", "docs?lang=en")) { return 0; }
    if same_origin(url, insecure_same_domain) { return 0; }
    if !same_domain(url, child) { return 0; }
    if !same_domain(url, insecure_same_domain) { return 0; }
    if same_domain(url, external) { return 0; }
    if !robots_allow.allowed { return 0; }
    if robots_deny.allowed { return 0; }
    if robots_prefix_deny.allowed { return 0; }
    if !robots_specific_allow.allowed { return 0; }
    if robots_case_comment.allowed { return 0; }
    if !robots_empty_disallow.allowed { return 0; }
    if robots_empty_allow_deny.allowed { return 0; }
    return 1;
}

flow check_fetch_and_mock_search() -> i32 ![] {
    let url = https("example.com", "/");
    let child = https("example.com", "docs");
    let external = https("other.example", "/");
    let query = search_query("etas", "example", 1);
    let language_query = with_language(query, "en-US");
    let empty_query = search_query("  ", "example", 5);
    let empty_provider_query = search_query("etas", "", 5);
    let provider_colon_query = search_query("etas", "ex:ample", 5);
    let provider_at_query = search_query("etas", "ex@ample", 5);
    let newline_query = search_query("etas\nruntime", "example", 5);
    let over_limit_query = search_query("etas", "example", 101);
    let bad_language_query = with_language(query, "en\nUS");
    let colon_language_query = with_language(query, "en:US");
    let tab_language_query = with_language(query, "en\tUS");
    let options = default_fetch_options();
    let custom_options = fetch_options(1000, 4096, "text/plain");
    let bad_timeout_options = fetch_options(0, 4096, "text/html");
    let bad_bytes_options = fetch_options(1000, 0, "text/html");
    let bad_accept_options = fetch_options(1000, 4096, "text/html\nx-bad: yes");
    let decoded = response_from_text(200, "text/html", "<html>ok</html>");
    let page = page_from_http(url, decoded.response);
    let mock_page = untrusted_page(url, 200, "text/html", "Mock", "<html>mock</html>");
    let mock_crawl = crawl_result(url, [mock_page], false, "fixture");
    let raw_results = [
        search_result("Etas guide", url, "language runtime", 1),
        search_result("Etas reference", child, "compiler", 2),
        search_result("Other", external, "unrelated", 3),
    ];
    let filtered = filter_results(query, raw_results);
    let empty_filtered = filter_results(empty_query, raw_results);
    let empty_provider_filtered = filter_results(empty_provider_query, raw_results);
    let over_limit_filtered = filter_results(over_limit_query, raw_results);

    if options.max_bytes != 1048576 { return 0; }
    if !is_valid_fetch_options(options) { return 0; }
    if !is_valid_fetch_options(custom_options) { return 0; }
    if is_valid_fetch_options(bad_timeout_options) { return 0; }
    if is_valid_fetch_options(bad_bytes_options) { return 0; }
    if is_valid_fetch_options(bad_accept_options) { return 0; }
    if count_untrusted_pages([page]) != 1 { return 0; }
    if count_untrusted_pages([mock_page]) != 1 { return 0; }
    if count_untrusted_pages(mock_crawl.pages) != 1 { return 0; }
    if mock_crawl.limit_reached { return 0; }
    if !is_valid_search_query(query) { return 0; }
    if !is_valid_search_query(language_query) { return 0; }
    if is_valid_search_query(empty_query) { return 0; }
    if is_valid_search_query(empty_provider_query) { return 0; }
    if is_valid_search_query(provider_colon_query) { return 0; }
    if is_valid_search_query(provider_at_query) { return 0; }
    if is_valid_search_query(newline_query) { return 0; }
    if is_valid_search_query(over_limit_query) { return 0; }
    if is_valid_search_query(bad_language_query) { return 0; }
    if is_valid_search_query(colon_language_query) { return 0; }
    if is_valid_search_query(tab_language_query) { return 0; }
    if count_results(raw_results) != 3 { return 0; }
    if count_untrusted_results(filtered) != 1 { return 0; }
    if count_untrusted_results(empty_filtered) != 0 { return 0; }
    if count_untrusted_results(empty_provider_filtered) != 0 { return 0; }
    if count_untrusted_results(over_limit_filtered) != 0 { return 0; }
    return 1;
}

flow check_crawl_and_trust() -> i32 ![] {
    let url = https("example.com", "/");
    let policy = crawl_policy(4, true);
    let zero_policy = crawl_policy(0, true);
    let large_policy = crawl_policy(1001, true);
    let no_robots_policy = CrawlPolicy { max_pages = 4, same_domain = true, obey_robots = false, max_bytes = 1048576 };
    let empty = empty_crawl_result(url);
    let sanitized = sanitize_html(url, "plain text");
    let unsafe = sanitize_html(url, "<script>alert(1)</script>");

    if policy.max_pages != 4 { return 0; }
    if !policy.same_domain { return 0; }
    if !policy.obey_robots { return 0; }
    if !is_valid_crawl_policy(policy) { return 0; }
    if is_valid_crawl_policy(zero_policy) { return 0; }
    if is_valid_crawl_policy(large_policy) { return 0; }
    if is_valid_crawl_policy(no_robots_policy) { return 0; }
    if empty.start.host != "example.com" { return 0; }
    if sanitized.source_url.host != "example.com" { return 0; }
    if !needs_sanitization("<a href=\"javascript:bad\">x</a>") { return 0; }
    if !needs_sanitization("JAVASCRIPT:alert(1)") { return 0; }
    if !needs_sanitization("VBSCRIPT:msgbox(1)") { return 0; }
    if !needs_sanitization("data:text/html,<script>") { return 0; }
    if !needs_sanitization("ONERROR=bad") { return 0; }
    if !needs_sanitization("ONLOAD=bad") { return 0; }
    if !needs_sanitization("onclick=bad") { return 0; }
    if !needs_sanitization("srcdoc=bad") { return 0; }
    if !needs_sanitization("style=background:url(javascript:bad)") { return 0; }
    if unsafe.source_url.host != "example.com" { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![] {
    if check_pure_web() + check_fetch_and_mock_search() + check_crawl_and_trust() == 3 {
        return 0;
    }
    return 1;
}

module tests.edk.tool_mock_surface.browser_git.main;

import edk.browser.effects.{EdkBrowser, EdkBrowserMock};
import edk.browser.errors.{BrowserError, SelectorError};
import edk.browser.mocks.browser.{mock_session, snapshot_with_body};
import edk.browser.page.https;
import edk.browser.pure.dom_snapshot.count_snapshot_nodes;
import edk.browser.selector.{css, is_css_selector, is_valid_selector, parse_selector};
import edk.browser.session.{browser_profile, create_session};
import edk.browser.tools.page.{click_selector, open_page, read_page};
import edk.browser.types.{Selector, Url};
import edk.git.effects.EdkGit;
import edk.git.errors.{GitError, GitRefError};
import edk.git.mocks.repo.clean_read_result;
import edk.git.patch.patch;
import edk.git.pure.patch_validate.validate_patch;
import edk.git.repo.{git_repo, is_valid_repo_ref};
import edk.git.tools.repo.{apply_patch as apply_repo_patch, repo_status, show_diff};
import edk.git.types.GitRepoRef;

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

flow must_git_repo(result: Result<GitRepoRef, GitRefError>) -> GitRepoRef ![Error<GitRefError>] {
    match result {
        Ok(repo) => {
            return repo;
        }
        Err(error) => {
            return perform Error<GitRefError>.raise(error);
        }
    }
}

flow main(args: Array<string>) -> i32 ![EdkBrowser.create, EdkBrowserMock.session, EdkBrowser.navigate, EdkBrowser.click, EdkBrowser.read, EdkGit.read, EdkGit.write, Error<BrowserError>, Error<SelectorError>, Error<GitError>, Error<GitRefError>] {
    let url = must_url(https("example.com", "/docs"));
    let session = create_session(browser_profile("default"), url);
    let mock_handle = mock_session("fixture", url);
    let selector_result = css("#save");
    let parsed_selector = parse_selector("text=Save");
    let selector = must_selector(selector_result);
    let snapshot = snapshot_with_body(url, "Docs", "hello");
    let page = open_page(session, url);
    let clicked = click_selector(session, selector);
    let current = read_page(session);

    let repo = must_git_repo(git_repo("fixture", "."));
    let read_fixture = clean_read_result();
    let status = repo_status(repo);
    let diff = show_diff(repo);
    let safe_patch = patch("diff --git a/README.md b/README.md");
    let patch_check = validate_patch(safe_patch);
    let receipt = apply_repo_patch(repo, safe_patch);

    if !is_css_selector(selector) { return 1; }
    if !is_valid_selector(selector) { return 1; }
    if !selector_ok(parsed_selector) { return 1; }
    if count_snapshot_nodes(snapshot) != 1 { return 1; }
    if snapshot.title != "Docs" { return 1; }
    if !is_valid_repo_ref(repo) { return 1; }
    if !patch_check.ok { return 1; }
    if !read_fixture.status.clean { return 1; }
    if page.title != page.title { return 1; }
    if clicked.title != clicked.title { return 1; }
    if current.title != current.title { return 1; }
    if status.clean != status.clean { return 1; }
    if diff.text != diff.text { return 1; }
    if receipt.change_kind != receipt.change_kind { return 1; }
    return 0;
}

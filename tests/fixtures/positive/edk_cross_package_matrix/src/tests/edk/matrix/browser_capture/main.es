module tests.edk.matrix.browser_capture.main;

import edk.browser.effects.{EdkBrowser, EdkBrowserMock};
import edk.browser.errors.BrowserError;
import edk.browser.mocks.browser.mock_session;
import edk.browser.page.{https, navigate, read as read_page};
import edk.browser.session.{browser_profile, create_session};
import edk.docs.pure.doc_model.count_blocks;
import edk.docs.pure.html_sanitize.{report, sanitize};
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.{atomic_options, create_or_replace, read, write};
import edk.workspace.glob.scope_matches;
import edk.workspace.path.{is_path_escape, path_scope, workspace_path};
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkBrowser.create, EdkBrowserMock.session, EdkBrowser.navigate, EdkBrowser.read, EdkWorkspace.read, EdkWorkspace.write, Error<BrowserError>, Error<WorkspaceError>] {
    let browser = create_session(browser_profile("default"), https("example.com", "/"));
    let mock_handle = mock_session("capture", https("example.com", "/"));
    let target = https("example.com", "/");
    let snapshot = navigate(browser, target);
    let current = read_page(browser);
    let captured = sanitize("captured plain text");
    let unsafe_report = report("<main>captured markup</main>");
    let safe_report = report("captured plain text");

    let source = checked_workspace_path("captures/raw.html");
    let output = checked_workspace_path("captures/page.html");
    let capture_scope = path_scope("captures/");
    let body = read(source);
    write(output, body, atomic_options(create_or_replace()));

    if target.host != "example.com" { return 1; }
    if snapshot.url.host != snapshot.url.host { return 1; }
    if current.title != current.title { return 1; }
    if count_blocks(captured.ast) != 0 { return 1; }
    if !unsafe_report.changed { return 1; }
    if safe_report.changed { return 1; }
    if is_path_escape(source) { return 1; }
    if is_path_escape(output) { return 1; }
    if !scope_matches(capture_scope, source) { return 1; }
    if !scope_matches(capture_scope, output) { return 1; }
    return 0;
}

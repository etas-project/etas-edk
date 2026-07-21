module edk.workspace.package_smoke;

import edk.workspace.files.{append_only, atomic_options, create_new, create_or_replace};
import edk.workspace.glob.{glob, is_glob_escape, matches_exact_or_all, scope_matches};
import edk.workspace.mocks.filesystem.{directory_entry, file_entry, file_stat, missing_stat};
import edk.workspace.errors.WorkspaceError;
import edk.workspace.path.{is_scope_escape, join_child, path_scope, path_value, report_path, report_workspace_path, workspace_path};
import edk.workspace.snapshot.{count_entries, empty_diff, empty_snapshot, snapshot};
import edk.workspace.types.{ReportPath, WorkspaceRootPath};

flow path_ok(result: Result<WorkspaceRootPath, WorkspaceError>) -> bool ![] {
    return match result {
        Ok(_) => true,
        Err(_) => false,
    };
}

flow path_value_is(result: Result<WorkspaceRootPath, WorkspaceError>, expected: string) -> bool ![] {
    return match result {
        Ok(path) => path_value(path) == expected,
        Err(_) => false,
    };
}

flow must_path(result: Result<WorkspaceRootPath, WorkspaceError>) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match result {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow report_ok(result: Result<ReportPath, WorkspaceError>) -> bool ![] {
    return match result {
        Ok(_) => true,
        Err(_) => false,
    };
}

flow report_value_is(result: Result<ReportPath, WorkspaceError>, expected: string) -> bool ![] {
    return match result {
        Ok(path) => path_value(report_workspace_path(path)) == expected,
        Err(_) => false,
    };
}

flow main(args: Array<string>) -> i32 ![Error<WorkspaceError>] {
    let base_result = workspace_path("src");
    let base = must_path(base_result);
    let joined = join_child(base, "main.es");
    let joined_dot = join_child(base, "./lib.es");
    let normalized_dot = workspace_path("src/./generated//main.es");
    let escaped = workspace_path("../secret");
    let nested_escape = join_child(base, "../secret");
    let backslash_escape = workspace_path("src\\..\\secret");
    let drive_escape = workspace_path("C:temp/secret.txt");
    let newline_escape = workspace_path("src\nsecret.txt");
    let tab_escape = workspace_path("src\tsecret.txt");
    let source_file = must_path(workspace_path("src/main.es"));
    let nested_source_file = must_path(workspace_path("src/nested/main.es"));
    let nested_source_like = must_path(workspace_path("other/src/main.es"));
    let scope_prefix_collision = must_path(workspace_path("src-old/main.es"));
    let source_scope = path_scope("src/");
    let escaped_scope = path_scope("../secret");
    let root_scope = path_scope("/");
    let control_scope = path_scope("src\nsecret");
    let wildcard = glob("src/*.es");
    let normalized_wildcard = glob("src//./*.es");
    let multi_wildcard_segment = glob("src/a*b*c.es");
    let escaped_wildcard = glob("../*.es");
    let root_wildcard = glob("/**");
    let control_wildcard = glob("src\t*.es");
    let report = report_path("reports/final.md");
    let report_escape = report_path("../secret");
    let report_outside = report_path("drafts/final.md");
    let snap = snapshot([
        file_entry(source_file, 128),
        directory_entry(must_path(workspace_path("src/generated"))),
    ]);
    let empty = empty_snapshot();
    let diff = empty_diff();
    let create_replace = atomic_options(create_or_replace());
    let create_only = create_new();
    let append = append_only();
    let stat = file_stat(source_file, 128, 42);
    let missing = missing_stat(must_path(workspace_path("missing.txt")));

    if !path_ok(base_result) { return 1; }
    if !path_value_is(joined, "src/main.es") { return 1; }
    if !path_value_is(joined_dot, "src/lib.es") { return 1; }
    if !path_value_is(normalized_dot, "src/generated/main.es") { return 1; }
    if path_ok(escaped) { return 1; }
    if path_ok(nested_escape) { return 1; }
    if path_ok(backslash_escape) { return 1; }
    if path_ok(drive_escape) { return 1; }
    if path_ok(newline_escape) { return 1; }
    if path_ok(tab_escape) { return 1; }
    if path_ok(workspace_path("/tmp/outside")) { return 1; }
    if path_ok(workspace_path("src/../secret")) { return 1; }
    if path_ok(workspace_path("src\\secret.txt")) { return 1; }
    if path_ok(workspace_path("C:temp/secret.txt")) { return 1; }
    if path_ok(workspace_path("src\nsecret.txt")) { return 1; }
    if path_ok(workspace_path("src\tsecret.txt")) { return 1; }
    if !matches_exact_or_all(wildcard, source_file) { return 1; }
    if !matches_exact_or_all(normalized_wildcard, source_file) { return 1; }
    if matches_exact_or_all(wildcard, nested_source_file) { return 1; }
    if matches_exact_or_all(multi_wildcard_segment, must_path(workspace_path("src/abc.es"))) { return 1; }
    if matches_exact_or_all(multi_wildcard_segment, must_path(workspace_path("src/ac.es"))) { return 1; }
    if !matches_exact_or_all(glob("src/**"), nested_source_file) { return 1; }
    if !matches_exact_or_all(glob("*"), must_path(workspace_path("README.md"))) { return 1; }
    if matches_exact_or_all(glob("*"), source_file) { return 1; }
    if matches_exact_or_all(wildcard, nested_source_like) { return 1; }
    if !matches_exact_or_all(glob("**"), must_path(workspace_path("any/path.txt"))) { return 1; }
    if !is_glob_escape(escaped_wildcard) { return 1; }
    if !is_glob_escape(root_wildcard) { return 1; }
    if !is_glob_escape(control_wildcard) { return 1; }
    if matches_exact_or_all(escaped_wildcard, must_path(workspace_path("secret/main.es"))) { return 1; }
    if matches_exact_or_all(root_wildcard, must_path(workspace_path("any/path.txt"))) { return 1; }
    if matches_exact_or_all(control_wildcard, source_file) { return 1; }
    if !report_value_is(report, "reports/final.md") { return 1; }
    if report_ok(report_escape) { return 1; }
    if report_ok(report_outside) { return 1; }
    if source_scope.pattern != "src" { return 1; }
    if !is_scope_escape(escaped_scope) { return 1; }
    if !is_scope_escape(root_scope) { return 1; }
    if !is_scope_escape(control_scope) { return 1; }
    if !scope_matches(source_scope, source_file) { return 1; }
    if scope_matches(escaped_scope, must_path(workspace_path("secret/main.es"))) { return 1; }
    if scope_matches(root_scope, source_file) { return 1; }
    if scope_matches(control_scope, source_file) { return 1; }
    if scope_matches(source_scope, nested_source_like) { return 1; }
    if scope_matches(source_scope, scope_prefix_collision) { return 1; }
    if count_entries(snap) != 2 { return 1; }
    if count_entries(empty) != 0 { return 1; }
    if !create_replace.sync { return 1; }
    if !create_replace.mode.replace { return 1; }
    if !create_only.create { return 1; }
    if create_only.replace { return 1; }
    if !append.append { return 1; }
    if !stat.exists { return 1; }
    if stat.size != 128 { return 1; }
    if missing.exists { return 1; }
    if count_entries(snapshot(diff.added)) != 0 { return 1; }
    return 0;
}

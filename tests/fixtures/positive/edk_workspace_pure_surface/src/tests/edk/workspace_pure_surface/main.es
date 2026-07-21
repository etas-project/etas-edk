module tests.edk.workspace_pure_surface.main;

import edk.workspace.files.{append_only, atomic_options, create_or_replace};
import edk.workspace.glob.{glob, is_glob_escape, matches_exact_or_all, scope_matches};
import edk.workspace.mocks.filesystem.{directory_entry, file_entry, file_stat, missing_stat};
import edk.workspace.errors.WorkspaceError;
import edk.workspace.path.{is_path_escape, is_scope_escape, join_child, normalize, path_scope, path_value, report_path, report_workspace_path, workspace_path};
import edk.workspace.snapshot.{count_entries, empty_diff, snapshot};
import edk.workspace.types.{ReportPath, WorkspaceRootPath};

flow path_ok(result: Result<WorkspaceRootPath, WorkspaceError>) -> bool ![] {
    return match result {
        Ok(path) => true,
        Err(error) => false,
    };
}

flow path_value_is(result: Result<WorkspaceRootPath, WorkspaceError>, expected: string) -> bool ![] {
    return match result {
        Ok(path) => path_value(path) == expected,
        Err(error) => false,
    };
}

flow report_ok(result: Result<ReportPath, WorkspaceError>) -> bool ![] {
    return match result {
        Ok(path) => true,
        Err(error) => false,
    };
}

flow report_value_is(result: Result<ReportPath, WorkspaceError>, expected: string) -> bool ![] {
    return match result {
        Ok(path) => path_value(report_workspace_path(path)) == expected,
        Err(error) => false,
    };
}

flow check_paths_and_globs() -> i32 ![] {
    let base_result = workspace_path("src");
    let base = match base_result {
        Ok(path) => path,
        Err(error) => {
            return 0;
        },
    };
    let child = join_child(base, "main.es");
    let child_with_dot = join_child(base, "./lib.es");
    let normalized_dot = workspace_path("src/./generated//main.es");
    let escaped = workspace_path("../secret");
    let nested_escape = join_child(base, "../secret");
    let backslash_escape = workspace_path("src\\..\\secret");
    let drive_escape = workspace_path("C:temp/secret.txt");
    let newline_escape = workspace_path("src\nsecret.txt");
    let tab_escape = workspace_path("src\tsecret.txt");
    let source_file = match workspace_path("src/main.es") {
        Ok(path) => path,
        Err(error) => {
            return 0;
        },
    };
    let nested_source_file = match workspace_path("src/nested/main.es") {
        Ok(path) => path,
        Err(error) => {
            return 0;
        },
    };
    let nested_source_like = match workspace_path("other/src/main.es") {
        Ok(path) => path,
        Err(error) => {
            return 0;
        },
    };
    let scope_prefix_collision = match workspace_path("src-old/main.es") {
        Ok(path) => path,
        Err(error) => {
            return 0;
        },
    };
    let source_scope = path_scope("src/");
    let escaped_scope = path_scope("../secret");
    let root_scope = path_scope("/");
    let control_scope = path_scope("src\nsecret");
    let escaped_glob = glob("../*.es");
    let root_glob = glob("/**");
    let control_glob = glob("src\t*.es");
    let normalized_glob = glob("src//./*.es");
    let multi_wildcard_segment = glob("src/a*b*c.es");
    let report = report_path("reports/final.md");
    let report_escape = report_path("../secret");
    let report_outside = report_path("drafts/final.md");

    if !path_ok(base_result) { return 0; }
    if !path_value_is(child, "src/main.es") { return 0; }
    if !path_value_is(child_with_dot, "src/lib.es") { return 0; }
    if !path_value_is(normalized_dot, "src/generated/main.es") { return 0; }
    if path_ok(escaped) { return 0; }
    if path_ok(nested_escape) { return 0; }
    if path_ok(backslash_escape) { return 0; }
    if path_ok(drive_escape) { return 0; }
    if path_ok(newline_escape) { return 0; }
    if path_ok(tab_escape) { return 0; }
    if path_ok(workspace_path("/tmp/outside")) { return 0; }
    if path_ok(workspace_path("src/../secret")) { return 0; }
    if path_ok(workspace_path("src\\secret.txt")) { return 0; }
    if path_ok(workspace_path("C:temp/secret.txt")) { return 0; }
    if path_ok(workspace_path("src\nsecret.txt")) { return 0; }
    if path_ok(workspace_path("src\tsecret.txt")) { return 0; }
    if !matches_exact_or_all(glob("src/*.es"), source_file) { return 0; }
    if !matches_exact_or_all(normalized_glob, source_file) { return 0; }
    if matches_exact_or_all(glob("src/*.es"), nested_source_file) { return 0; }
    if matches_exact_or_all(multi_wildcard_segment, match workspace_path("src/abc.es") { Ok(path) => path, Err(error) => { return 0; } }) { return 0; }
    if matches_exact_or_all(multi_wildcard_segment, match workspace_path("src/ac.es") { Ok(path) => path, Err(error) => { return 0; } }) { return 0; }
    if !matches_exact_or_all(glob("src/**"), nested_source_file) { return 0; }
    if !matches_exact_or_all(glob("*"), match workspace_path("README.md") { Ok(path) => path, Err(error) => { return 0; } }) { return 0; }
    if matches_exact_or_all(glob("*"), source_file) { return 0; }
    if matches_exact_or_all(glob("src/*.es"), nested_source_like) { return 0; }
    if !matches_exact_or_all(glob("**"), match workspace_path("nested/file.txt") { Ok(path) => path, Err(error) => { return 0; } }) { return 0; }
    if !is_glob_escape(escaped_glob) { return 0; }
    if !is_glob_escape(root_glob) { return 0; }
    if !is_glob_escape(control_glob) { return 0; }
    if matches_exact_or_all(escaped_glob, match workspace_path("secret/main.es") { Ok(path) => path, Err(error) => { return 0; } }) { return 0; }
    if matches_exact_or_all(root_glob, match workspace_path("nested/file.txt") { Ok(path) => path, Err(error) => { return 0; } }) { return 0; }
    if matches_exact_or_all(control_glob, source_file) { return 0; }
    if !report_ok(report) { return 0; }
    if !report_value_is(report, "reports/final.md") { return 0; }
    if report_ok(report_escape) { return 0; }
    if report_ok(report_outside) { return 0; }
    if source_scope.pattern != "src" { return 0; }
    if !is_scope_escape(escaped_scope) { return 0; }
    if !is_scope_escape(root_scope) { return 0; }
    if !is_scope_escape(control_scope) { return 0; }
    if !scope_matches(source_scope, source_file) { return 0; }
    if scope_matches(escaped_scope, match workspace_path("secret/main.es") { Ok(path) => path, Err(error) => { return 0; } }) { return 0; }
    if scope_matches(root_scope, source_file) { return 0; }
    if scope_matches(control_scope, source_file) { return 0; }
    if scope_matches(source_scope, nested_source_like) { return 0; }
    if scope_matches(source_scope, scope_prefix_collision) { return 0; }
    return 1;
}

flow check_snapshots_and_mocks() -> i32 ![] {
    let source_file = match workspace_path("src/main.es") {
        Ok(path) => path,
        Err(error) => {
            return 0;
        },
    };
    let snap = snapshot([
        file_entry(source_file, 128),
        directory_entry(match workspace_path("src/generated") { Ok(path) => path, Err(error) => { return 0; } }),
    ]);
    let diff = empty_diff();
    let options = atomic_options(create_or_replace());
    let append = append_only();
    let stat = file_stat(source_file, 128, 42);
    let missing = missing_stat(match workspace_path("missing.txt") { Ok(path) => path, Err(error) => { return 0; } });

    if count_entries(snap) != 2 { return 0; }
    if count_entries(snapshot(diff.added)) != 0 { return 0; }
    if !options.sync { return 0; }
    if !options.mode.replace { return 0; }
    if !append.append { return 0; }
    if !stat.exists { return 0; }
    if stat.kind != "file" { return 0; }
    if missing.exists { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![] {
    if check_paths_and_globs() + check_snapshots_and_mocks() == 2 {
        return 0;
    }
    return 1;
}

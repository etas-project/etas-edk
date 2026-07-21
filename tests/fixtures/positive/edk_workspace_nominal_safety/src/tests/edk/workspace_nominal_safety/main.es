module tests.edk.workspace_nominal_safety.main;

import std.codec.text.utf8_encode;
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.{atomic_options, create_or_replace, write_report_path};
import edk.workspace.path.report_path;
import edk.workspace.types.ReportPath;

flow checked_report_path(value: string) -> ReportPath ![Error<WorkspaceError>] {
    return match report_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow rejects_escape() -> bool ![] {
    return match report_path("../secret.txt") {
        Ok(path) => false,
        Err(error) => true,
    };
}

flow main(args: Array<string>) -> i32 ![EdkWorkspace.write, Error<WorkspaceError>] {
    if !rejects_escape() {
        return 1;
    }
    let path = checked_report_path("reports/a.md");
    write_report_path(path, utf8_encode("ok"), atomic_options(create_or_replace()));
    return 0;
}

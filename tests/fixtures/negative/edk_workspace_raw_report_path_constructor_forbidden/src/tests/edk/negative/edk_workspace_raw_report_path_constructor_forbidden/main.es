module tests.edk.negative.edk_workspace_raw_report_path_constructor_forbidden.main;

import std.codec.text.utf8_encode;
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.{atomic_options, create_or_replace, write_report_path};
import edk.workspace.types.{ReportsRoot, WorkspacePath};

flow main(args: Array<string>) -> i32 ![EdkWorkspace.write, Error<WorkspaceError>] {
    let path = WorkspacePath<ReportsRoot>("../secret.txt");
    write_report_path(path, utf8_encode("bad"), atomic_options(create_or_replace()));
    return 0;
}

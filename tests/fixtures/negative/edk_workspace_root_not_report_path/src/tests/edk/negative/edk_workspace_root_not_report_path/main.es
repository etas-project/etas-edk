module tests.edk.negative.edk_workspace_root_not_report_path.main;

import std.codec.text.utf8_encode;
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.{atomic_options, create_or_replace, write_report_path};
import edk.workspace.path.workspace_path;
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkWorkspace.write, Error<WorkspaceError>] {
    let root_path = checked_workspace_path("docs/a.md");
    write_report_path(root_path, utf8_encode("bad"), atomic_options(create_or_replace()));
    return 0;
}

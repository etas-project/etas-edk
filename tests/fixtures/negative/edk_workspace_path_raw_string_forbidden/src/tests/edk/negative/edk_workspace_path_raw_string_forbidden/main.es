module tests.edk.negative.edk_workspace_path_raw_string_forbidden.main;

import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.read;

flow main(args: Array<string>) -> i32 ![EdkWorkspace.read, Error<WorkspaceError>] {
    let body = read("../secret.txt");
    return 0;
}

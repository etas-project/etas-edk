module edk.workspace.pure.path_normalize;

import edk.workspace.path.normalize;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.types.WorkspaceRootPath;

public flow normalize_path(path: WorkspaceRootPath) -> Result<WorkspaceRootPath, WorkspaceError> ![] {
    return normalize(path);
}

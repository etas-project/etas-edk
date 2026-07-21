module edk.workspace.errors;

import edk.workspace.types.WorkspaceRootPath;

public type WorkspaceError = {
    kind: string,
    path: WorkspaceRootPath,
    message: string,
};

public type PathEscapeError = {
    path: WorkspaceRootPath,
    message: string,
};

public type NotFoundError = {
    path: WorkspaceRootPath,
    message: string,
};

public type PermissionError = {
    path: WorkspaceRootPath,
    message: string,
};

public type ConflictError = {
    path: WorkspaceRootPath,
    message: string,
};

public type InvalidGlobError = {
    pattern: string,
    message: string,
};

public flow workspace_error(kind: string, path: WorkspaceRootPath, message: string) -> WorkspaceError ![] {
    return WorkspaceError {
        kind = kind,
        path = path,
        message = message,
    };
}

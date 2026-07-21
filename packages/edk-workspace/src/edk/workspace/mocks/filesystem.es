module edk.workspace.mocks.filesystem;

import edk.workspace.types.{FileStat, WorkspaceEntry, WorkspaceRootPath};

public flow file_entry(path: WorkspaceRootPath, size: i64) -> WorkspaceEntry ![] {
    return WorkspaceEntry {
        path = path,
        kind = "file",
        size = size,
    };
}

public flow directory_entry(path: WorkspaceRootPath) -> WorkspaceEntry ![] {
    return WorkspaceEntry {
        path = path,
        kind = "directory",
        size = 0,
    };
}

public flow missing_stat(path: WorkspaceRootPath) -> FileStat ![] {
    return FileStat {
        path = path,
        exists = false,
        kind = "",
        size = 0,
        modified_millis = 0,
    };
}

public flow file_stat(path: WorkspaceRootPath, size: i64, modified_millis: i64) -> FileStat ![] {
    return FileStat {
        path = path,
        exists = true,
        kind = "file",
        size = size,
        modified_millis = modified_millis,
    };
}

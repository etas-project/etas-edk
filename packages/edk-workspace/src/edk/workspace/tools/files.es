module edk.workspace.tools.files;

import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.{list, read, write};
import edk.workspace.types.{AtomicWriteOptions, ListablePath, ReadablePath, WorkspaceEntry, WorkspaceRegion, WritablePath};

public tool read_bytes<R ~ WorkspaceRegion, P ~ ReadablePath<R>>(path: P) -> bytes ![EdkWorkspace.read<R>, Error<WorkspaceError>] {
    return read(path);
}

public tool write_bytes<R ~ WorkspaceRegion, P ~ WritablePath<R>>(path: P, body: bytes, options: AtomicWriteOptions) -> unit ![EdkWorkspace.write<R>, Error<WorkspaceError>] {
    write(path, body, options);
    return;
}

public tool list_files<R ~ WorkspaceRegion, P ~ ListablePath<R>>(path: P) -> Array<WorkspaceEntry> ![EdkWorkspace.list<R>, Error<WorkspaceError>] {
    return list(path);
}

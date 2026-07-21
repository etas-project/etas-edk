module edk.workspace.files;

import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.types.{AtomicWriteOptions, ListablePath, ReadablePath, ReportsRoot, WorkspaceEntry, WorkspaceRegion, WritablePath, WriteMode};

public flow create_or_replace() -> WriteMode ![] {
    return WriteMode { create = true, replace = true, append = false };
}

public flow create_new() -> WriteMode ![] {
    return WriteMode { create = true, replace = false, append = false };
}

public flow append_only() -> WriteMode ![] {
    return WriteMode { create = true, replace = false, append = true };
}

public flow atomic_options(mode: WriteMode) -> AtomicWriteOptions ![] {
    return AtomicWriteOptions { mode = mode, sync = true };
}

public flow read<R ~ WorkspaceRegion, P ~ ReadablePath<R>>(path: P) -> bytes ![EdkWorkspace.read<R>, Error<WorkspaceError>] {
    return perform EdkWorkspace.read(path);
}

public flow write<R ~ WorkspaceRegion, P ~ WritablePath<R>>(path: P, body: bytes, options: AtomicWriteOptions) -> unit ![EdkWorkspace.write<R>, Error<WorkspaceError>] {
    perform EdkWorkspace.write(path, body);
    return;
}

public flow list<R ~ WorkspaceRegion, P ~ ListablePath<R>>(path: P) -> Array<WorkspaceEntry> ![EdkWorkspace.list<R>, Error<WorkspaceError>] {
    return perform EdkWorkspace.list(path);
}

public flow read_report_path<P ~ ReadablePath<ReportsRoot>>(path: P) -> bytes ![EdkWorkspace.read<ReportsRoot>, Error<WorkspaceError>] {
    return read(path);
}

public flow write_report_path<P ~ WritablePath<ReportsRoot>>(path: P, body: bytes, options: AtomicWriteOptions) -> unit ![EdkWorkspace.write<ReportsRoot>, Error<WorkspaceError>] {
    write(path, body, options);
    return;
}

public flow list_report_path<P ~ ListablePath<ReportsRoot>>(path: P) -> Array<WorkspaceEntry> ![EdkWorkspace.list<ReportsRoot>, Error<WorkspaceError>] {
    return list(path);
}

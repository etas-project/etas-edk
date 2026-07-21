module edk.workspace.effects;

import edk.workspace.types.{ListablePath, ReadablePath, WorkspaceEntry, WorkspaceRegion, WritablePath};

public effect EdkWorkspace extends FileIO {
    action read<R ~ WorkspaceRegion, P ~ ReadablePath<R>>(path: P) -> bytes;
    action write<R ~ WorkspaceRegion, P ~ WritablePath<R>>(path: P, body: bytes) -> unit;
    action list<R ~ WorkspaceRegion, P ~ ListablePath<R>>(path: P) -> Array<WorkspaceEntry>;
}

module edk.workspace.snapshot;

import edk.workspace.types.{WorkspaceDiff, WorkspaceEntry, WorkspaceSnapshot};

public flow empty_snapshot() -> WorkspaceSnapshot ![] {
    let entries: Array<WorkspaceEntry> = [];
    return WorkspaceSnapshot { entries = entries };
}

public flow snapshot(entries: Array<WorkspaceEntry>) -> WorkspaceSnapshot ![] {
    return WorkspaceSnapshot { entries = entries };
}

public flow count_entries(snapshot: WorkspaceSnapshot) -> i32 ![] {
    var total = 0;
    for entry in snapshot.entries limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow empty_diff() -> WorkspaceDiff ![] {
    let added: Array<WorkspaceEntry> = [];
    let removed: Array<WorkspaceEntry> = [];
    let changed: Array<WorkspaceEntry> = [];
    return WorkspaceDiff {
        added = added,
        removed = removed,
        changed = changed,
    };
}

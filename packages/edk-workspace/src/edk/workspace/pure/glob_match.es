module edk.workspace.pure.glob_match;

import edk.workspace.glob.matches_exact_or_all;
import edk.workspace.types.{Glob, WorkspaceRootPath};

public flow matches(glob: Glob, path: WorkspaceRootPath) -> bool ![] {
    return matches_exact_or_all(glob, path);
}

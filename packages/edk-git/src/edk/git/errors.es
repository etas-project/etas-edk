module edk.git.errors;

import edk.git.types.{GitRepoRef, Patch};

public type GitError = {
    kind: string,
    repo: GitRepoRef,
    message: string,
};

public type GitRefError = {
    kind: string,
    value: string,
    message: string,
};

public flow git_ref_error(kind: string, value: string, message: string) -> GitRefError ![] {
    return GitRefError {
        kind = kind,
        value = value,
        message = message,
    };
}

public type PatchError = {
    patch: Patch,
    message: string,
};

public type ConflictError = {
    path: string,
    message: string,
};

public type CommandError = {
    program: string,
    message: string,
};

public type RepositoryError = {
    repo: GitRepoRef,
    message: string,
};

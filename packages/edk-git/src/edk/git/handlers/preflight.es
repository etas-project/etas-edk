module edk.git.handlers.preflight;

import edk.git.commit.is_valid_commit_message;
import edk.git.pure.patch_validate.validate_patch;
import edk.git.repo.is_valid_repo_ref;
import edk.git.types.{GitChange, GitRepoRef};

public alias PreflightResult = {
    ok: bool,
    kind: string,
    message: string,
};

flow ok_preflight() -> PreflightResult ![] {
    return PreflightResult {
        ok = true,
        kind = "",
        message = "",
    };
}

flow preflight_error(kind: string, message: string) -> PreflightResult ![] {
    return PreflightResult {
        ok = false,
        kind = kind,
        message = message,
    };
}

public flow preflight_read(repo: GitRepoRef) -> PreflightResult ![] {
    if !is_valid_repo_ref(repo) {
        return preflight_error("invalid_repo", "invalid Git repository reference");
    }
    return ok_preflight();
}

public flow preflight_write(repo: GitRepoRef, change: GitChange) -> PreflightResult ![] {
    if !is_valid_repo_ref(repo) {
        return preflight_error("invalid_repo", "invalid Git repository reference");
    }
    if change.kind == "patch" {
        let validation = validate_patch(change.patch);
        if !validation.ok {
            return preflight_error("invalid_patch", validation.message);
        }
    }
    if change.kind == "commit" {
        if !is_valid_commit_message(change.message) {
            return preflight_error("invalid_commit_message", "invalid commit message");
        }
    }
    return ok_preflight();
}

module edk.git.patch;

import edk.git.effects.EdkGit;
import edk.git.errors.GitError;
import edk.git.types.{CommitMessage, GitChange, GitRepoRef, GitWriteReceipt, Patch, PatchValidation};

public flow patch(text: string) -> Patch ![] {
    return Patch { text = text };
}

public flow patch_change(patch: Patch) -> GitChange ![] {
    return GitChange {
        kind = "patch",
        patch = patch,
        message = CommitMessage { subject = "", body = "" },
    };
}

public flow validation_ok() -> PatchValidation ![] {
    return PatchValidation { ok = true, message = "" };
}

public flow validation_error(message: string) -> PatchValidation ![] {
    return PatchValidation { ok = false, message = message };
}

public flow apply_patch(repo: GitRepoRef, patch: Patch) -> GitWriteReceipt ![EdkGit.write, Error<GitError>] {
    return perform EdkGit.write(repo, patch_change(patch));
}

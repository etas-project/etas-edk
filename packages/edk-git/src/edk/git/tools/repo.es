module edk.git.tools.repo;

import edk.git.commit.commit_change;
import edk.git.diff.diff;
import edk.git.effects.EdkGit;
import edk.git.errors.GitError;
import edk.git.patch.patch_change;
import edk.git.repo.status;
import edk.git.types.{CommitMessage, CommitReceipt, GitDiff, GitRepoRef, GitStatus, GitWriteReceipt, Patch};

public tool repo_status(repo: GitRepoRef) -> GitStatus ![EdkGit.read, Error<GitError>] {
    return status(repo);
}

public tool show_diff(repo: GitRepoRef) -> GitDiff ![EdkGit.read, Error<GitError>] {
    return diff(repo);
}

public tool apply_patch(repo: GitRepoRef, patch: Patch) -> GitWriteReceipt ![EdkGit.write, Error<GitError>] {
    return perform EdkGit.write(repo, patch_change(patch));
}

public tool commit_changes(repo: GitRepoRef, message: CommitMessage) -> CommitReceipt ![EdkGit.write, Error<GitError>] {
    return perform EdkGit.write(repo, commit_change(message));
}

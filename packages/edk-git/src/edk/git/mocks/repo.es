module edk.git.mocks.repo;

import edk.git.diff.git_diff;
import edk.git.repo.{default_branch, empty_status, git_status, status_entry};
import edk.git.types.{GitDiff, GitDiffFile, GitReadResult, GitRepoRef, GitStatus, GitStatusEntry, GitWriteReceipt};
import edk.git.errors.GitRefError;

public flow clean_read_result() -> GitReadResult ![] {
    let files: Array<GitDiffFile> = [];
    return GitReadResult {
        status = empty_status(default_branch()),
        diff = git_diff(files, ""),
    };
}

public flow diff_read_result(diff: GitDiff) -> GitReadResult ![] {
    return GitReadResult {
        status = empty_status(default_branch()),
        diff = diff,
    };
}

public flow status_read_result(status: GitStatus, diff: GitDiff) -> GitReadResult ![] {
    return GitReadResult {
        status = status,
        diff = diff,
    };
}

public flow modified_status(path: string) -> Result<GitStatus, GitRefError> ![] {
    match status_entry(path, "modified") {
        Ok(entry) => {
            let entries: Array<GitStatusEntry> = [entry];
            return Ok(git_status(default_branch(), entries));
        },
        Err(error) => {
            return Err(error);
        },
    }
}

public flow write_receipt(repo: GitRepoRef, change_kind: string, message: string) -> GitWriteReceipt ![] {
    return GitWriteReceipt {
        repo = repo,
        change_kind = change_kind,
        message = message,
    };
}

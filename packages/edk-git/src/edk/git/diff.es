module edk.git.diff;

import std.text.trim;
import edk.git.effects.EdkGit;
import edk.git.errors.GitError;
import edk.git.repo.read;
import edk.git.types.{GitDiff, GitDiffFile, GitRepoRef};

public flow diff_file(old_path: string, new_path: string, hunks: i32) -> GitDiffFile ![] {
    return GitDiffFile {
        old_path = trim(old_path),
        new_path = trim(new_path),
        hunks = hunks,
    };
}

public flow git_diff(files: Array<GitDiffFile>, text: string) -> GitDiff ![] {
    return GitDiff {
        files = files,
        text = text,
    };
}

public flow diff(repo: GitRepoRef) -> GitDiff ![EdkGit.read, Error<GitError>] {
    return read(repo).diff;
}

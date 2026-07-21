module edk.git.effects;

import edk.git.types.{GitChange, GitReadResult, GitRepoRef, GitWriteReceipt};

public effect EdkGit extends FileIO {
    action read(repo: GitRepoRef) -> GitReadResult;
    action write(repo: GitRepoRef, change: GitChange) -> GitWriteReceipt;
}

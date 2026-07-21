module edk.git.types;

public spec GitRepositoryTarget;
public spec GitBranchTarget;
public spec GitRemoteTarget;
public spec GitStatusPath;

public alias GitRepoSpec = {
    name: string,
    path: string,
};

public type GitRepoRef = GitRepoSpec;

impl GitRepoRef ~ GitRepositoryTarget;

public alias BranchSpec = {
    name: string,
};

public type BranchRef = BranchSpec;

impl BranchRef ~ GitBranchTarget;

public alias RemoteSpec = {
    name: string,
    url: string,
};

public type RemoteRef = RemoteSpec;

impl RemoteRef ~ GitRemoteTarget;

public alias GitStatusEntrySpec = {
    path: string,
    state: string,
};

public type GitStatusEntry = GitStatusEntrySpec;

impl GitStatusEntry ~ GitStatusPath;

public alias GitStatus = {
    branch: BranchRef,
    entries: Array<GitStatusEntry>,
    clean: bool,
};

public alias GitDiffFile = {
    old_path: string,
    new_path: string,
    hunks: i32,
};

public alias GitDiff = {
    files: Array<GitDiffFile>,
    text: string,
};

public alias Patch = {
    text: string,
};

public alias PatchValidation = {
    ok: bool,
    message: string,
};

public alias CommitMessage = {
    subject: string,
    body: string,
};

public alias GitChange = {
    kind: string,
    patch: Patch,
    message: CommitMessage,
};

public alias GitReadResult = {
    status: GitStatus,
    diff: GitDiff,
};

public alias GitWriteReceipt = {
    repo: GitRepoRef,
    change_kind: string,
    message: string,
};

public alias CommitReceipt = GitWriteReceipt;

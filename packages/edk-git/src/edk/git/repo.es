module edk.git.repo;

import std.text.{contains, split, starts_with, trim};
import edk.git.effects.EdkGit;
import edk.git.errors.{GitError, GitRefError, git_ref_error};
import edk.git.types.{BranchRef, BranchSpec, GitDiff, GitDiffFile, GitReadResult, GitRepoRef, GitRepoSpec, GitStatus, GitStatusEntry, GitStatusEntrySpec, RemoteRef, RemoteSpec};

flow raw_git_repo(name: string, path: string) -> GitRepoSpec ![] {
    return GitRepoSpec {
        name = trim(name),
        path = trim(path),
    };
}

flow raw_git_repo_ref(repo: GitRepoSpec) -> GitRepoRef ![] {
    return GitRepoRef(repo);
}

flow raw_branch(name: string) -> BranchSpec ![] {
    return BranchSpec { name = trim(name) };
}

flow raw_branch_ref(branch: BranchSpec) -> BranchRef ![] {
    return BranchRef(branch);
}

flow raw_remote(name: string, url: string) -> RemoteSpec ![] {
    return RemoteSpec {
        name = trim(name),
        url = trim(url),
    };
}

flow raw_remote_ref(remote: RemoteSpec) -> RemoteRef ![] {
    return RemoteRef(remote);
}

flow raw_status_entry(path: string, state: string) -> GitStatusEntrySpec ![] {
    return GitStatusEntrySpec {
        path = trim(path),
        state = trim(state),
    };
}

flow raw_status_entry_ref(entry: GitStatusEntrySpec) -> GitStatusEntry ![] {
    return GitStatusEntry(entry);
}

public flow git_repo(name: string, path: string) -> Result<GitRepoRef, GitRefError> ![] {
    let repo = raw_git_repo(name, path);
    if !is_valid_repo_spec(repo) {
        return Err(git_ref_error("invalid_repo", trim(name), "invalid Git repository reference"));
    }
    return Ok(raw_git_repo_ref(repo));
}

public flow git_repo_value(repo: GitRepoRef) -> GitRepoSpec ![] {
    return repo;
}

public flow branch(name: string) -> Result<BranchRef, GitRefError> ![] {
    let value = raw_branch(name);
    if !is_valid_branch_spec(value) {
        return Err(git_ref_error("invalid_branch", trim(name), "invalid Git branch reference"));
    }
    return Ok(raw_branch_ref(value));
}

public flow default_branch() -> BranchRef ![] {
    return raw_branch_ref(raw_branch("main"));
}

public flow branch_value(branch: BranchRef) -> BranchSpec ![] {
    return branch;
}

public flow remote(name: string, url: string) -> Result<RemoteRef, GitRefError> ![] {
    let value = raw_remote(name, url);
    if !is_valid_remote_spec(value) {
        return Err(git_ref_error("invalid_remote", trim(name), "invalid Git remote reference"));
    }
    return Ok(raw_remote_ref(value));
}

public flow remote_value(remote: RemoteRef) -> RemoteSpec ![] {
    return remote;
}

public flow status_entry(path: string, state: string) -> Result<GitStatusEntry, GitRefError> ![] {
    let entry = raw_status_entry(path, state);
    if !is_valid_status_entry_spec(entry) {
        return Err(git_ref_error("invalid_status_entry", trim(path), "invalid Git status entry"));
    }
    return Ok(raw_status_entry_ref(entry));
}

public flow status_entry_value(entry: GitStatusEntry) -> GitStatusEntrySpec ![] {
    return entry;
}

public flow path_escapes_repo(path: string) -> bool ![] {
    let value = trim(path);
    if starts_with(value, "/") {
        return true;
    }
    if contains(value, "\\") || contains(value, ":") {
        return true;
    }
    if contains(value, "\n") || contains(value, "\r") || contains(value, "\t") {
        return true;
    }
    for part in split(value, "/") limit Iterations(65536) {
        if part == ".." {
            return true;
        }
    }
    return false;
}

flow ends_with_text(value: string, suffix: string) -> bool ![] {
    if suffix == "" {
        return true;
    }
    if !contains(value, suffix) {
        return false;
    }
    var last = value;
    for part in split(value, suffix) limit Iterations(65536) {
        last = part;
    }
    return last == "";
}

flow is_safe_ref_component(component: string) -> bool ![] {
    return component != ""
        && !starts_with(component, ".")
        && !ends_with_text(component, ".")
        && !ends_with_text(component, ".lock");
}

public flow is_safe_ref_name(value: string) -> bool ![] {
    let name = trim(value);
    if name == "" || name == "@" {
        return false;
    }
    if starts_with(name, "/") || starts_with(name, ".") || ends_with_text(name, "/") || ends_with_text(name, ".") {
        return false;
    }
    if contains(name, " ")
        || contains(name, "\\")
        || contains(name, "..")
        || contains(name, "//")
        || contains(name, "@{")
        || contains(name, ":")
        || contains(name, "?")
        || contains(name, "#")
        || contains(name, "~")
        || contains(name, "^")
        || contains(name, "*")
        || contains(name, "[")
        || contains(name, "\n")
        || contains(name, "\r")
        || contains(name, "\t")
    {
        return false;
    }
    for component in split(name, "/") limit Iterations(256) {
        if !is_safe_ref_component(component) {
            return false;
        }
    }
    return true;
}

flow is_safe_remote_url(url: string) -> bool ![] {
    let value = trim(url);
    if value == "" {
        return false;
    }
    if contains(value, " ")
        || contains(value, "\\")
        || contains(value, "\n")
        || contains(value, "\r")
        || contains(value, "\t")
        || contains(value, "?")
        || contains(value, "#")
        || contains(value, "/../")
        || contains(value, "/./")
        || ends_with_text(value, "/..")
        || ends_with_text(value, "/.")
    {
        return false;
    }
    if starts_with(value, "https://") || starts_with(value, "http://") {
        return value != "https://"
            && value != "http://"
            && !contains(value, "@")
            && !starts_with(value, "https:///")
            && !starts_with(value, "http:///");
    }
    if starts_with(value, "ssh://") {
        return value != "ssh://"
            && !starts_with(value, "ssh:///");
    }
    if starts_with(value, "git@") {
        return contains(value, ":")
            && !contains(value, ":/")
            && !contains(value, ":../")
            && !ends_with_text(value, ":");
    }
    return false;
}

public flow is_valid_branch_spec(branch: BranchSpec) -> bool ![] {
    return is_safe_ref_name(branch.name);
}

public flow is_valid_branch_ref(branch: BranchRef) -> bool ![] {
    return is_valid_branch_spec(branch_value(branch));
}

public flow is_valid_repo_spec(repo: GitRepoSpec) -> bool ![] {
    return is_safe_ref_name(repo.name)
        && repo.path != ""
        && !path_escapes_repo(repo.path);
}

public flow is_valid_repo_ref(repo: GitRepoRef) -> bool ![] {
    return is_valid_repo_spec(git_repo_value(repo));
}

public flow is_valid_remote_spec(remote: RemoteSpec) -> bool ![] {
    return is_safe_ref_name(remote.name)
        && is_safe_remote_url(remote.url);
}

public flow is_valid_remote_ref(remote: RemoteRef) -> bool ![] {
    return is_valid_remote_spec(remote_value(remote));
}

public flow is_valid_status_entry_spec(entry: GitStatusEntrySpec) -> bool ![] {
    return entry.path != ""
        && entry.state != ""
        && !contains(entry.state, "\n")
        && !contains(entry.state, "\r")
        && !contains(entry.state, "\t")
        && !path_escapes_repo(entry.path);
}

public flow is_valid_status_entry(entry: GitStatusEntry) -> bool ![] {
    return is_valid_status_entry_spec(status_entry_value(entry));
}

public flow count_status_entries(entries: Array<GitStatusEntry>) -> i32 ![] {
    var total = 0;
    for entry in entries limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow git_status(branch: BranchRef, entries: Array<GitStatusEntry>) -> GitStatus ![] {
    return GitStatus {
        branch = branch,
        entries = entries,
        clean = count_status_entries(entries) == 0,
    };
}

public flow empty_status(branch: BranchRef) -> GitStatus ![] {
    let entries: Array<GitStatusEntry> = [];
    return git_status(branch, entries);
}

public flow empty_diff() -> GitDiff ![] {
    let files: Array<GitDiffFile> = [];
    return GitDiff {
        files = files,
        text = "",
    };
}

public flow read(repo: GitRepoRef) -> GitReadResult ![EdkGit.read, Error<GitError>] {
    return perform EdkGit.read(repo);
}

public flow status(repo: GitRepoRef) -> GitStatus ![EdkGit.read, Error<GitError>] {
    return read(repo).status;
}

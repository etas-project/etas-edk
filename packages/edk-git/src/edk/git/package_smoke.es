module edk.git.package_smoke;

import edk.git.commit.{commit_message, is_valid_commit_message};
import edk.git.errors.GitRefError;
import edk.git.mocks.repo.{clean_read_result, modified_status, status_read_result, write_receipt};
import edk.git.patch.patch;
import edk.git.pure.diff_parse.{count_diff_files, count_total_hunks, parse_file_headers};
import edk.git.pure.patch_validate.{patch_path_token_escapes_repo, validate_patch};
import edk.git.repo.{branch, branch_value, count_status_entries, git_repo, git_repo_value, git_status, is_safe_ref_name, is_valid_branch_ref, is_valid_remote_ref, is_valid_repo_ref, is_valid_status_entry, path_escapes_repo, remote, status_entry};
import edk.git.types.{BranchRef, GitRepoRef, GitStatus, GitStatusEntry, RemoteRef};

flow must_repo(result: Result<GitRepoRef, GitRefError>) -> GitRepoRef ![Error<GitRefError>] {
    match result {
        Ok(repo) => {
            return repo;
        }
        Err(error) => {
            return perform Error<GitRefError>.raise(error);
        }
    }
}

flow repo_ok(result: Result<GitRepoRef, GitRefError>) -> bool ![] {
    match result {
        Ok(repo) => {
            return is_valid_repo_ref(repo);
        }
        Err(_) => {
            return false;
        }
    }
}

flow must_branch(result: Result<BranchRef, GitRefError>) -> BranchRef ![Error<GitRefError>] {
    match result {
        Ok(value) => {
            return value;
        }
        Err(error) => {
            return perform Error<GitRefError>.raise(error);
        }
    }
}

flow branch_ok(result: Result<BranchRef, GitRefError>) -> bool ![] {
    match result {
        Ok(value) => {
            return is_valid_branch_ref(value);
        }
        Err(_) => {
            return false;
        }
    }
}

flow must_remote(result: Result<RemoteRef, GitRefError>) -> RemoteRef ![Error<GitRefError>] {
    match result {
        Ok(value) => {
            return value;
        }
        Err(error) => {
            return perform Error<GitRefError>.raise(error);
        }
    }
}

flow remote_ok(result: Result<RemoteRef, GitRefError>) -> bool ![] {
    match result {
        Ok(value) => {
            return is_valid_remote_ref(value);
        }
        Err(_) => {
            return false;
        }
    }
}

flow must_status_entry(result: Result<GitStatusEntry, GitRefError>) -> GitStatusEntry ![Error<GitRefError>] {
    match result {
        Ok(value) => {
            return value;
        }
        Err(error) => {
            return perform Error<GitRefError>.raise(error);
        }
    }
}

flow status_entry_ok(result: Result<GitStatusEntry, GitRefError>) -> bool ![] {
    match result {
        Ok(value) => {
            return is_valid_status_entry(value);
        }
        Err(_) => {
            return false;
        }
    }
}

flow must_status(result: Result<GitStatus, GitRefError>) -> GitStatus ![Error<GitRefError>] {
    match result {
        Ok(value) => {
            return value;
        }
        Err(error) => {
            return perform Error<GitRefError>.raise(error);
        }
    }
}

flow main(args: Array<string>) -> i32 ![Error<GitRefError>] {
    let repo_result = git_repo("main", ".");
    let repo = must_repo(repo_result);
    let bad_name_repo = git_repo("bad repo", ".");
    let bad_repo = git_repo("main", "../outside");
    let backslash_repo = git_repo("main", "src\\repo");
    let drive_repo = git_repo("main", "C:repo");
    let tab_repo = git_repo("main", "src\trepo");
    let diff_text = "diff --git a/src/main.es b/src/main.es\n@@ -1 +1 @@\n";
    let parsed = parse_file_headers(diff_text);
    let result = validate_patch(patch(diff_text));
    let bad = validate_patch(patch("diff --git a/../secret b/../secret"));
    let absolute_bad = validate_patch(patch("diff --git a/src/main.es /tmp/main.es"));
    let backslash_bad = validate_patch(patch("diff --git a/src\\secret b/src\\secret"));
    let drive_bad = validate_patch(patch("diff --git a/C:secret b/C:secret"));
    let tab_bad = validate_patch(patch("diff --git a/src\tsecret b/src\tsecret"));
    let rename_bad = validate_patch(patch("diff --git a/src/main.es b/src/main.es\nrename from src/main.es\nrename to ../secret"));
    let new_file = validate_patch(patch("diff --git a/new.es b/new.es\n--- /dev/null\n+++ b/new.es\n@@ -0,0 +1 @@\n+module new;"));
    let good_entry_result = status_entry("src/main.es", "modified");
    let good_entry = must_status_entry(good_entry_result);
    let status = git_status(must_branch(branch("main")), [good_entry]);
    let bad_branch = branch("feature..bad");
    let bad_entry = status_entry("../secret", "modified");
    let backslash_entry = status_entry("src\\secret", "modified");
    let drive_entry = status_entry("C:secret", "modified");
    let tab_entry = status_entry("src\tsecret", "modified");
    let tab_state_entry = status_entry("src/secret", "mod\tified");
    let modified = must_status(modified_status("src/lib.es"));
    let clean = clean_read_result();
    let read = status_read_result(status, parsed);
    let receipt = write_receipt(repo, "patch", "accepted");
    let message = commit_message("Update EDK", "body");
    let invalid_message = commit_message("", "");
    let subject_newline_message = commit_message("Update\nEDK", "body");
    let body_cr_message = commit_message("Update EDK", "body\rbad");
    let origin_result = remote("origin", "https://example.com/etas.git");
    let origin = must_remote(origin_result);
    let ssh_origin_result = remote("origin", "git@example.com:etas/etas.git");
    let ssh_origin = must_remote(ssh_origin_result);
    let bad_remote = remote("bad", "../repo.git");
    let bad_remote_name = remote("bad remote", "https://example.com/etas.git");
    let bad_remote_url = remote("origin", "https://bad host/etas.git");
    let tab_remote_url = remote("origin", "https://example.com/etas\t.git");
    let credential_remote = remote("origin", "https://token@example.com/etas.git");
    let exact_scheme_remote = remote("origin", "https://");
    let empty_host_remote = remote("origin", "https:///etas.git");
    let empty_ssh_remote = remote("origin", "ssh://");
    let parent_remote = remote("origin", "https://example.com/../secret.git");
    let scp_parent_remote = remote("origin", "git@example.com:../secret.git");
    let scp_absolute_remote = remote("origin", "git@example.com:/secret.git");
    let scp_missing_path_remote = remote("origin", "git@example.com:");
    let leading_slash_branch = branch("/main");
    let trailing_slash_branch = branch("feature/");
    let empty_component_branch = branch("feature//docs");
    let dot_component_branch = branch("feature/.hidden");
    let lock_component_branch = branch("feature/main.lock");
    let tab_branch = branch("feature\tmain");
    let at_ref_branch = branch("@");
    let reflog_branch = branch("feature@{1}");
    let wildcard_branch = branch("feature/*");

    if git_repo_value(repo).name != "main" { return 1; }
    if !repo_ok(repo_result) { return 1; }
    if repo_ok(bad_name_repo) { return 1; }
    if repo_ok(bad_repo) { return 1; }
    if repo_ok(backslash_repo) { return 1; }
    if repo_ok(drive_repo) { return 1; }
    if repo_ok(tab_repo) { return 1; }
    if !remote_ok(origin_result) { return 1; }
    if !remote_ok(ssh_origin_result) { return 1; }
    if !is_valid_remote_ref(origin) { return 1; }
    if !is_valid_remote_ref(ssh_origin) { return 1; }
    if remote_ok(bad_remote) { return 1; }
    if remote_ok(bad_remote_name) { return 1; }
    if remote_ok(bad_remote_url) { return 1; }
    if remote_ok(tab_remote_url) { return 1; }
    if remote_ok(credential_remote) { return 1; }
    if remote_ok(exact_scheme_remote) { return 1; }
    if remote_ok(empty_host_remote) { return 1; }
    if remote_ok(empty_ssh_remote) { return 1; }
    if remote_ok(parent_remote) { return 1; }
    if remote_ok(scp_parent_remote) { return 1; }
    if remote_ok(scp_absolute_remote) { return 1; }
    if remote_ok(scp_missing_path_remote) { return 1; }
    if !branch_ok(branch("main")) { return 1; }
    if branch_value(must_branch(branch("main"))).name != "main" { return 1; }
    if branch_ok(bad_branch) { return 1; }
    if branch_ok(leading_slash_branch) { return 1; }
    if branch_ok(trailing_slash_branch) { return 1; }
    if branch_ok(empty_component_branch) { return 1; }
    if branch_ok(dot_component_branch) { return 1; }
    if branch_ok(lock_component_branch) { return 1; }
    if branch_ok(tab_branch) { return 1; }
    if branch_ok(at_ref_branch) { return 1; }
    if branch_ok(reflog_branch) { return 1; }
    if branch_ok(wildcard_branch) { return 1; }
    if !is_safe_ref_name("feature/docs") { return 1; }
    if !is_safe_ref_name("feature/docs-v2") { return 1; }
    if is_safe_ref_name("feature..bad") { return 1; }
    if is_safe_ref_name("feature/main.") { return 1; }
    if is_safe_ref_name("feature/name~1") { return 1; }
    if is_safe_ref_name("feature/name^1") { return 1; }
    if is_safe_ref_name("feature/[bad]") { return 1; }
    if is_safe_ref_name("feature\tbad") { return 1; }
    if path_escapes_repo("src/main.es") { return 1; }
    if !path_escapes_repo("../secret") { return 1; }
    if !path_escapes_repo("src\\secret") { return 1; }
    if !path_escapes_repo("C:secret") { return 1; }
    if !path_escapes_repo("src\tsecret") { return 1; }
    if path_escapes_repo("..hidden/repo") { return 1; }
    if !result.ok { return 1; }
    if bad.ok { return 1; }
    if absolute_bad.ok { return 1; }
    if backslash_bad.ok { return 1; }
    if drive_bad.ok { return 1; }
    if tab_bad.ok { return 1; }
    if rename_bad.ok { return 1; }
    if !new_file.ok { return 1; }
    if !patch_path_token_escapes_repo("a/src/../secret") { return 1; }
    if !patch_path_token_escapes_repo("a/src\\secret") { return 1; }
    if !patch_path_token_escapes_repo("a/C:secret") { return 1; }
    if !patch_path_token_escapes_repo("a/src\tsecret") { return 1; }
    if patch_path_token_escapes_repo("a/src/..hidden") { return 1; }
    if patch_path_token_escapes_repo("/dev/null") { return 1; }
    if count_diff_files(parsed) != 1 { return 1; }
    if count_total_hunks(parsed) != 1 { return 1; }
    if count_status_entries(status.entries) != 1 { return 1; }
    if !status_entry_ok(good_entry_result) { return 1; }
    if !is_valid_status_entry(good_entry) { return 1; }
    if status_entry_ok(bad_entry) { return 1; }
    if status_entry_ok(backslash_entry) { return 1; }
    if status_entry_ok(drive_entry) { return 1; }
    if status_entry_ok(tab_entry) { return 1; }
    if status_entry_ok(tab_state_entry) { return 1; }
    if status.clean { return 1; }
    if modified.clean { return 1; }
    if !clean.status.clean { return 1; }
    if read.diff.text != diff_text { return 1; }
    if receipt.change_kind != "patch" { return 1; }
    if !is_valid_commit_message(message) { return 1; }
    if is_valid_commit_message(invalid_message) { return 1; }
    if is_valid_commit_message(subject_newline_message) { return 1; }
    if is_valid_commit_message(body_cr_message) { return 1; }
    return 0;
}

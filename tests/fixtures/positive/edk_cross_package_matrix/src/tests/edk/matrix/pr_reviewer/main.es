module tests.edk.matrix.pr_reviewer.main;

import edk.git.diff.diff;
import edk.git.effects.EdkGit;
import edk.git.errors.{GitError, GitRefError};
import edk.git.repo.{git_repo, is_valid_repo_ref as is_valid_git_repo_ref};
import edk.git.types.GitRepoRef;
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.pr.{branch_ref, comment_pr, is_valid_pull_request, pull_request, review_comment, review_path};
import edk.github.repo.{github_repo, is_valid_repo_ref as is_valid_github_repo_ref};
import edk.github.types.{BranchRef, GitHubRepoRef, PullRequestRef, ReviewComment, ReviewPath};
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.list;
import edk.workspace.path.workspace_path;
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow checked_git_repo(name: string, path: string) -> GitRepoRef ![Error<GitRefError>] {
    return match git_repo(name, path) {
        Ok(repo) => repo,
        Err(error) => perform Error<GitRefError>.raise(error),
    };
}

flow checked_github_repo(owner: string, name: string) -> GitHubRepoRef ![Error<GitHubError>] {
    return match github_repo(owner, name) {
        Ok(repo) => repo,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_branch_ref(value: string) -> BranchRef ![Error<GitHubError>] {
    return match branch_ref(value) {
        Ok(branch) => branch,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_pull_request(repo: GitHubRepoRef, number: i32, head: BranchRef, base: BranchRef) -> PullRequestRef<GitHubRepoRef, BranchRef, BranchRef> ![Error<GitHubError>] {
    return match pull_request(repo, number, head, base) {
        Ok(pr) => pr,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_review_path(value: string) -> ReviewPath ![Error<GitHubError>] {
    return match review_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_review_comment(path: ReviewPath, line: i32, body: string) -> ReviewComment<ReviewPath> ![Error<GitHubError>] {
    return match review_comment(path, line, body) {
        Ok(comment) => comment,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkGit.read, EdkGitHub.pr_comment, EdkWorkspace.list, Secret.read, Error<GitError>, Error<GitRefError>, Error<GitHubError>, Error<WorkspaceError>] {
    let repo = checked_git_repo("etas", ".");
    let current_diff = diff(repo);
    let entries = list(checked_workspace_path("."));

    let github_repo = checked_github_repo("etas-lang", "etas");
    let head = checked_branch_ref("feature");
    let base = checked_branch_ref("main");
    let pr = checked_pull_request(github_repo, 42, head, base);
    let comment_body = "EDK matrix review comment idempotency-key=matrix-pr-42";
    let comment_path = checked_review_path("src/main.es");
    let review = checked_review_comment(comment_path, 12, comment_body);
    let comment = comment_pr(github_repo, pr, review);

    if !is_valid_git_repo_ref(repo) { return 1; }
    if !is_valid_github_repo_ref(github_repo) { return 1; }
    if !is_valid_pull_request(pr) { return 1; }
    if comment_body == "" { return 1; }
    if current_diff.text != current_diff.text { return 1; }
    if entries != entries { return 1; }
    if comment.id != comment.id { return 1; }
    return 0;
}

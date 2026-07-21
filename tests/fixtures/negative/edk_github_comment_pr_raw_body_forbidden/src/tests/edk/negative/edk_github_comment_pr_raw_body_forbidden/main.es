module tests.edk.negative.edk_github_comment_pr_raw_body_forbidden.main;

import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.pr.{branch_ref, comment_pr, pull_request};
import edk.github.repo.github_repo;
import edk.github.types.{BranchRef, GitHubRepoRef, PullRequestRef};

flow checked_repo(owner: string, name: string) -> GitHubRepoRef ![Error<GitHubError>] {
    return match github_repo(owner, name) {
        Ok(repo) => repo,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_branch(value: string) -> BranchRef ![Error<GitHubError>] {
    return match branch_ref(value) {
        Ok(branch) => branch,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_pr(repo: GitHubRepoRef, number: i32, head: BranchRef, base: BranchRef) -> PullRequestRef<GitHubRepoRef, BranchRef, BranchRef> ![Error<GitHubError>] {
    return match pull_request(repo, number, head, base) {
        Ok(pr) => pr,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkGitHub.pr_comment, Secret.read, Error<GitHubError>] {
    let repo = checked_repo("etas-lang", "etas");
    let head = checked_branch("feature");
    let base = checked_branch("main");
    let pr = checked_pr(repo, 7, head, base);
    let comment = comment_pr(repo, pr, "raw body");
    if comment.id != "" {
        return 1;
    }
    return 0;
}

module tests.edk.negative.edk_github_raw_pull_request_spec_not_target.main;

import edk.github.errors.GitHubError;
import edk.github.pr.branch_ref;
import edk.github.repo.github_repo;
import edk.github.types.{BranchRef, GitHubPullRequestTarget, GitHubRepoRef, PullRequestSpec};

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

flow requires_pr_target<P ~ GitHubPullRequestTarget<GitHubRepoRef>>(repo: GitHubRepoRef, pr: P) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![Error<GitHubError>] {
    let repo = checked_repo("etas-lang", "etas");
    let head = checked_branch("feature");
    let base = checked_branch("main");
    let pr = PullRequestSpec<GitHubRepoRef, BranchRef, BranchRef> {
        repo = repo,
        number = 7,
        head = head,
        base = base,
    };
    return requires_pr_target(repo, pr);
}

module tests.edk.negative.edk_github_raw_pull_request_constructor_forbidden.main;

import edk.github.errors.GitHubError;
import edk.github.pr.{branch_ref, is_valid_pull_request};
import edk.github.repo.github_repo;
import edk.github.types.{BranchRef, GitHubRepoRef, PullRequestRef, PullRequestSpec};

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

flow main(args: Array<string>) -> i32 ![Error<GitHubError>] {
    let repo = checked_repo("etas-lang", "etas");
    let head = checked_branch("feature");
    let base = checked_branch("main");
    let spec = PullRequestSpec<GitHubRepoRef, BranchRef, BranchRef> {
        repo = repo,
        number = -1,
        head = head,
        base = base,
    };
    let pr = PullRequestRef<GitHubRepoRef, BranchRef, BranchRef>(spec);
    if is_valid_pull_request(pr) {
        return 1;
    }
    return 0;
}

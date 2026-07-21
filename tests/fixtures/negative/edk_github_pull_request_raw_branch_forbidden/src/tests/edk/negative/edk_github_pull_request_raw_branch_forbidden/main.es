module tests.edk.negative.edk_github_pull_request_raw_branch_forbidden.main;

import edk.github.errors.GitHubError;
import edk.github.pr.pull_request;
import edk.github.repo.github_repo;
import edk.github.types.GitHubRepoRef;

flow checked_repo(owner: string, name: string) -> GitHubRepoRef ![Error<GitHubError>] {
    return match github_repo(owner, name) {
        Ok(repo) => repo,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<GitHubError>] {
    let repo = checked_repo("etas-lang", "etas");
    let pr = pull_request(repo, 7, "feature", "main");
    return 0;
}

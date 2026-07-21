module tests.edk.negative.edk_github_raw_repo_spec_not_target.main;

import edk.github.types.{GitHubRepoSpec, GitHubTarget};

flow requires_github_target[R: GitHubTarget](repo: R) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let repo = GitHubRepoSpec {
        owner = "etas-lang",
        name = "etas",
        api_host = "api.github.com",
    };
    return requires_github_target(repo);
}

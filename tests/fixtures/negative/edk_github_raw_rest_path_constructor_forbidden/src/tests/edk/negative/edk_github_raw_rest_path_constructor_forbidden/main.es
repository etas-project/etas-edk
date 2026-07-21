module tests.edk.negative.edk_github_raw_rest_path_constructor_forbidden.main;

import edk.github.repo.query;
import edk.github.types.{GitHubRestPath, GitHubRestPathSpec};

flow main(args: Array<string>) -> i32 ![] {
    let spec = GitHubRestPathSpec { value = "../secret" };
    let path = GitHubRestPath(spec);
    let requested = query("pull_request", 7, path);
    return 0;
}

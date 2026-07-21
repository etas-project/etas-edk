module tests.edk.negative.edk_github_raw_rest_path_forbidden.main;

import edk.github.repo.query;

flow main(args: Array<string>) -> i32 ![] {
    let requested = query("pull_request", 7, "src/main.es");
    return 0;
}

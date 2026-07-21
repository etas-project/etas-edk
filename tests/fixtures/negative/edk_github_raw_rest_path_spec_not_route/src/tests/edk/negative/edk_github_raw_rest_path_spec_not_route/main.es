module tests.edk.negative.edk_github_raw_rest_path_spec_not_route.main;

import edk.github.types.{GitHubRestPathSpec, GitHubRestRoute};

flow requires_rest_route<P ~ GitHubRestRoute>(path: P) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let path = GitHubRestPathSpec { value = "src/main.es" };
    return requires_rest_route(path);
}

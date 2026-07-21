module tests.edk.negative.edk_github_raw_review_path_spec_not_review_path.main;

import edk.github.types.{GitHubReviewPath, ReviewPathSpec};

flow requires_review_path<P ~ GitHubReviewPath>(path: P) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let path = ReviewPathSpec { value = "src/main.es" };
    return requires_review_path(path);
}

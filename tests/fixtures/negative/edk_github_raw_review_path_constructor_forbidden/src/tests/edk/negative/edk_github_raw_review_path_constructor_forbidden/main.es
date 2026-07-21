module tests.edk.negative.edk_github_raw_review_path_constructor_forbidden.main;

import edk.github.pr.review_comment;
import edk.github.types.{ReviewPath, ReviewPathSpec};

flow main(args: Array<string>) -> i32 ![] {
    let spec = ReviewPathSpec { value = "../secret" };
    let path = ReviewPath(spec);
    let comment = review_comment(path, 1, "comment");
    return 0;
}

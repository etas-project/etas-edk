module tests.edk.negative.edk_github_raw_review_comment_constructor_forbidden.main;

import edk.github.errors.GitHubError;
import edk.github.pr.{review_path, is_valid_review_comment};
import edk.github.types.{ReviewComment, ReviewCommentSpec, ReviewPath};

flow checked_review_path(value: string) -> ReviewPath ![Error<GitHubError>] {
    return match review_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<GitHubError>] {
    let path = checked_review_path("src/main.es");
    let spec = ReviewCommentSpec<ReviewPath> {
        path = path,
        line = 0,
        body = "",
    };
    let comment = ReviewComment<ReviewPath>(spec);
    if is_valid_review_comment(comment) {
        return 1;
    }
    return 0;
}

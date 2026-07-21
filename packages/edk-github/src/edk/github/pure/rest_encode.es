module edk.github.pure.rest_encode;

import std.text.{join, to_string_i32};
import edk.github.errors.GitHubError;
import edk.github.pr.{pull_request_value, review_comment_value, review_path_value};
import edk.github.repo.{repo_path, rest_path, rest_path_value};
import edk.github.types.{BranchRef, GitHubQuery, GitHubRepoRef, GitHubRestPath, IssueDraft, PullRequestRef, RestRequestSpec, ReviewComment, ReviewPath};

flow request(method: string, path: string, body: string) -> Result<RestRequestSpec<GitHubRestPath>, GitHubError> ![] {
    match rest_path(path) {
        Ok(value) => {
            return Ok(RestRequestSpec<GitHubRestPath> {
                method = method,
                path = value,
                body = body,
            });
        }
        Err(error) => {
            return Err(error);
        }
    }
}

public flow create_issue_request(repo: GitHubRepoRef, draft: IssueDraft) -> Result<RestRequestSpec<GitHubRestPath>, GitHubError> ![] {
    let parts: Array<string> = [rest_path_value(repo_path(repo)), "issues"];
    return request(
        "POST",
        join(parts, "/"),
        join([draft.title, draft.body], "\n\n"),
    );
}

public flow pr_comment_request(repo: GitHubRepoRef, pr: PullRequestRef<GitHubRepoRef, BranchRef, BranchRef>, comment: ReviewComment<ReviewPath>) -> Result<RestRequestSpec<GitHubRestPath>, GitHubError> ![] {
    let pr_value = pull_request_value(pr);
    let comment_value = review_comment_value(comment);
    let parts: Array<string> = [rest_path_value(repo_path(repo)), "pulls", to_string_i32(pr_value.number), "comments"];
    let payload = join([review_path_value(comment_value.path), to_string_i32(comment_value.line), comment_value.body], "\n");
    return request("POST", join(parts, "/"), payload);
}

public flow read_query_request(repo: GitHubRepoRef, query: GitHubQuery<GitHubRestPath>) -> Result<RestRequestSpec<GitHubRestPath>, GitHubError> ![] {
    let prefix: Array<string> = [rest_path_value(repo_path(repo)), query.kind, to_string_i32(query.number)];
    if rest_path_value(query.path) == "" {
        return request("GET", join(prefix, "/"), "");
    }
    let parts: Array<string> = [rest_path_value(repo_path(repo)), query.kind, to_string_i32(query.number), rest_path_value(query.path)];
    return request("GET", join(parts, "/"), "");
}

public flow get_pr_request(repo: GitHubRepoRef, pr: PullRequestRef<GitHubRepoRef, BranchRef, BranchRef>) -> Result<RestRequestSpec<GitHubRestPath>, GitHubError> ![] {
    let pr_value = pull_request_value(pr);
    let parts: Array<string> = [rest_path_value(repo_path(repo)), "pulls", to_string_i32(pr_value.number)];
    return request("GET", join(parts, "/"), "");
}

module edk.github.pr;

import std.text.{contains, split, starts_with, trim};
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.repo.{is_safe_repo_path, query, rest_path};
import edk.github.types.{BranchRef, BranchSpec, CommentRef, GitHubBranchRef, GitHubPullRequestTarget, GitHubQuery, GitHubRestPath, GitHubResult, GitHubTarget, PullRequestRef, PullRequestSpec, ReviewComment, ReviewCommentSpec, ReviewPath, ReviewPathSpec, GitHubReviewPath};

flow github_error(code: string, message: string) -> GitHubError ![] {
    return GitHubError {
        code = code,
        message = message,
    };
}

flow raise_github_error(error: GitHubError) -> never ![Error<GitHubError>] {
    return perform Error<GitHubError>.raise(error);
}

flow raw_branch_spec(value: string) -> BranchSpec ![] {
    return BranchSpec {
        name = trim(value),
    };
}

flow raw_branch_ref(spec: BranchSpec) -> BranchRef ![] {
    return BranchRef(spec);
}

public flow branch_ref_value(branch: BranchRef) -> BranchSpec ![] {
    return branch;
}

public flow branch_ref(value: string) -> Result<BranchRef, GitHubError> ![] {
    let branch = raw_branch_spec(value);
    if !is_valid_branch_spec(branch) {
        return Err(github_error("invalid_branch_ref", "invalid Git branch reference"));
    }
    return Ok(raw_branch_ref(branch));
}

flow raw_pull_request<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(repo: R, number: i32, head: H, base: B) -> PullRequestSpec<R, H, B> ![] {
    return PullRequestSpec<R, H, B> {
        repo = repo,
        number = number,
        head = head,
        base = base,
    };
}

flow raw_pull_request_ref<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(pr: PullRequestSpec<R, H, B>) -> PullRequestRef<R, H, B> ![] {
    return PullRequestRef<R, H, B>(pr);
}

public flow pull_request_value<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(pr: PullRequestRef<R, H, B>) -> PullRequestSpec<R, H, B> ![] {
    return pr;
}

public flow pull_request<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(repo: R, number: i32, head: H, base: B) -> Result<PullRequestRef<R, H, B>, GitHubError> ![] {
    let pr = raw_pull_request(repo, number, head, base);
    if !is_valid_pull_request_spec(pr) {
        return Err(github_error("invalid_pull_request", "invalid pull request reference"));
    }
    return Ok(raw_pull_request_ref(pr));
}

flow raw_review_path(value: string) -> ReviewPathSpec ![] {
    return ReviewPathSpec {
        value = trim(value),
    };
}

flow raw_review_path_ref(path: ReviewPathSpec) -> ReviewPath ![] {
    return ReviewPath(path);
}

public flow review_path(value: string) -> Result<ReviewPath, GitHubError> ![] {
    let path = raw_review_path(value);
    if !is_valid_review_path_spec(path) {
        return Err(github_error("invalid_review_path", "invalid GitHub review path"));
    }
    return Ok(raw_review_path_ref(path));
}

public flow review_path_value(path: ReviewPath) -> string ![] {
    let value: ReviewPathSpec = path;
    return value.value;
}

flow raw_review_comment<P ~ GitHubReviewPath>(path: P, line: i32, body: string) -> ReviewCommentSpec<P> ![] {
    return ReviewCommentSpec<P> {
        path = path,
        line = line,
        body = body,
    };
}

flow raw_review_comment_ref<P ~ GitHubReviewPath>(comment: ReviewCommentSpec<P>) -> ReviewComment<P> ![] {
    return ReviewComment<P>(comment);
}

public flow review_comment_value<P ~ GitHubReviewPath>(comment: ReviewComment<P>) -> ReviewCommentSpec<P> ![] {
    return comment;
}

public flow review_comment<P ~ GitHubReviewPath>(path: P, line: i32, body: string) -> Result<ReviewComment<P>, GitHubError> ![] {
    let comment = raw_review_comment(path, line, body);
    if !is_valid_review_comment_spec(comment) {
        return Err(github_error("invalid_review_comment", "invalid review comment"));
    }
    return Ok(raw_review_comment_ref(comment));
}

flow ends_with_text(value: string, suffix: string) -> bool ![] {
    if suffix == "" {
        return true;
    }
    if !contains(value, suffix) {
        return false;
    }
    var last = value;
    for part in split(value, suffix) limit Iterations(65536) {
        last = part;
    }
    return last == "";
}

flow is_safe_ref_component(component: string) -> bool ![] {
    return component != ""
        && !starts_with(component, ".")
        && !ends_with_text(component, ".")
        && !ends_with_text(component, ".lock");
}

public flow is_safe_ref_name(value: string) -> bool ![] {
    let name = trim(value);
    if name == "" || name == "@" {
        return false;
    }
    if starts_with(name, "/") || starts_with(name, ".") || ends_with_text(name, "/") || ends_with_text(name, ".") {
        return false;
    }
    if contains(name, " ")
        || contains(name, "\\")
        || contains(name, "..")
        || contains(name, "//")
        || contains(name, "@{")
        || contains(name, ":")
        || contains(name, "?")
        || contains(name, "#")
        || contains(name, "~")
        || contains(name, "^")
        || contains(name, "*")
        || contains(name, "[")
        || contains(name, "\n")
        || contains(name, "\r")
        || contains(name, "\t")
    {
        return false;
    }
    for component in split(name, "/") limit Iterations(256) {
        if !is_safe_ref_component(component) {
            return false;
        }
    }
    return true;
}

public flow is_valid_branch_ref(branch: BranchRef) -> bool ![] {
    return is_valid_branch_spec(branch_ref_value(branch));
}

public flow is_valid_branch_spec(branch: BranchSpec) -> bool ![] {
    return is_safe_ref_name(branch.name);
}

public flow is_valid_pull_request<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(pr: PullRequestRef<R, H, B>) -> bool ![] {
    return is_valid_pull_request_spec(pull_request_value(pr));
}

public flow is_valid_pull_request_spec<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(pr: PullRequestSpec<R, H, B>) -> bool ![] {
    return pr.number > 0;
}

public flow is_valid_review_path(path: ReviewPath) -> bool ![] {
    let value: ReviewPathSpec = path;
    return is_valid_review_path_spec(value);
}

public flow is_valid_review_path_spec(path: ReviewPathSpec) -> bool ![] {
    return is_safe_repo_path(path.value);
}

public flow is_valid_review_comment<P ~ GitHubReviewPath>(comment: ReviewComment<P>) -> bool ![] {
    return is_valid_review_comment_spec(review_comment_value(comment));
}

public flow is_valid_review_comment_spec<P ~ GitHubReviewPath>(comment: ReviewCommentSpec<P>) -> bool ![] {
    return comment.line > 0
        && trim(comment.body) != "";
}

public flow pr_query<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(pr: PullRequestRef<R, H, B>) -> Result<GitHubQuery<GitHubRestPath>, GitHubError> ![] {
    let requested_pr = pull_request_value(pr);
    let path = rest_path("");
    match path {
        Err(error) => {
            return Err(error);
        }
        Ok(value) => {
            return query("pull_request", requested_pr.number, value);
        }
    }
}

public flow comment_pr<R ~ GitHubTarget, P ~ GitHubPullRequestTarget<R>, C ~ GitHubReviewPath>(repo: R, pr: P, comment: ReviewComment<C>) -> CommentRef ![EdkGitHub.pr_comment<R>, Secret.read, Error<GitHubError>] {
    if !is_valid_review_comment(comment) {
        return raise_github_error(github_error("invalid_review_comment", "invalid review comment"));
    }
    return perform EdkGitHub.pr_comment(repo, pr, comment);
}

public flow get_pr<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(repo: R, pr: PullRequestRef<R, H, B>) -> GitHubResult<R> ![EdkGitHub.read<R>, Secret.read, Error<GitHubError>] {
    let requested = pr_query(pr);
    match requested {
        Err(error) => {
            return raise_github_error(error);
        }
        Ok(value) => {
            return perform EdkGitHub.read(repo, value);
        }
    }
}

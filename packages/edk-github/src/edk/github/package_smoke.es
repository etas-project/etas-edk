module edk.github.package_smoke;

import edk.github.auth.{default_token_ref, token_ref};
import edk.github.errors.{AuthError, GitHubError};
import edk.github.issue.{count_labels, is_valid_idempotency_key, is_valid_issue_draft, issue_draft, with_idempotency_key, with_label};
import edk.github.mocks.api.{api_result, comment_ref, issue_ref};
import edk.github.pr.{branch_ref, branch_ref_value, is_safe_ref_name, is_valid_branch_ref, is_valid_pull_request, is_valid_review_comment, is_valid_review_path, pr_query, pull_request, pull_request_value, review_comment, review_comment_value, review_path, review_path_value};
import edk.github.pure.rest_encode.{create_issue_request, get_pr_request, pr_comment_request, read_query_request};
import edk.github.pure.webhook_verify.verify_signature_header;
import edk.github.repo.{github_enterprise_repo, github_repo, github_repo_value, is_safe_repo_path, is_valid_query, is_valid_repo_ref, is_valid_rest_path, query, repo_path, rest_path, rest_path_value};
import edk.github.types.{BranchRef, GitHubQuery, GitHubRepoRef, GitHubRestPath, GitHubTokenRef, PullRequestRef, RestRequestSpec, ReviewComment, ReviewPath};

flow must_repo(result: Result<GitHubRepoRef, GitHubError>) -> GitHubRepoRef ![Error<GitHubError>] {
    match result {
        Ok(repo) => {
            return repo;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow repo_ok(result: Result<GitHubRepoRef, GitHubError>) -> bool ![] {
    match result {
        Ok(repo) => {
            return is_valid_repo_ref(repo);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_branch(result: Result<BranchRef, GitHubError>) -> BranchRef ![Error<GitHubError>] {
    match result {
        Ok(branch) => {
            return branch;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow branch_ok(result: Result<BranchRef, GitHubError>) -> bool ![] {
    match result {
        Ok(branch) => {
            return is_valid_branch_ref(branch);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_pr(result: Result<PullRequestRef<GitHubRepoRef, BranchRef, BranchRef>, GitHubError>) -> PullRequestRef<GitHubRepoRef, BranchRef, BranchRef> ![Error<GitHubError>] {
    match result {
        Ok(pr) => {
            return pr;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow pr_ok(result: Result<PullRequestRef<GitHubRepoRef, BranchRef, BranchRef>, GitHubError>) -> bool ![] {
    match result {
        Ok(pr) => {
            return is_valid_pull_request(pr);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_rest_path(result: Result<GitHubRestPath, GitHubError>) -> GitHubRestPath ![Error<GitHubError>] {
    match result {
        Ok(path) => {
            return path;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow rest_path_ok(result: Result<GitHubRestPath, GitHubError>) -> bool ![] {
    match result {
        Ok(path) => {
            return is_valid_rest_path(path);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_review_path(result: Result<ReviewPath, GitHubError>) -> ReviewPath ![Error<GitHubError>] {
    match result {
        Ok(path) => {
            return path;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow review_path_ok(result: Result<ReviewPath, GitHubError>) -> bool ![] {
    match result {
        Ok(path) => {
            return is_valid_review_path(path);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_review(result: Result<ReviewComment<ReviewPath>, GitHubError>) -> ReviewComment<ReviewPath> ![Error<GitHubError>] {
    match result {
        Ok(comment) => {
            return comment;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow review_ok(result: Result<ReviewComment<ReviewPath>, GitHubError>) -> bool ![] {
    match result {
        Ok(comment) => {
            return is_valid_review_comment(comment);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_query(result: Result<GitHubQuery<GitHubRestPath>, GitHubError>) -> GitHubQuery<GitHubRestPath> ![Error<GitHubError>] {
    match result {
        Ok(value) => {
            return value;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow query_ok(result: Result<GitHubQuery<GitHubRestPath>, GitHubError>) -> bool ![] {
    match result {
        Ok(value) => {
            return is_valid_query(value);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_request(result: Result<RestRequestSpec<GitHubRestPath>, GitHubError>) -> RestRequestSpec<GitHubRestPath> ![Error<GitHubError>] {
    match result {
        Ok(value) => {
            return value;
        }
        Err(error) => {
            return perform Error<GitHubError>.raise(error);
        }
    }
}

flow token_ref_blocked(result: Result<GitHubTokenRef, AuthError>) -> bool ![] {
    match result {
        Ok(token) => {
            return false;
        }
        Err(error) => {
            return error.message == "GitHub token references require SecretKey<GitHubToken> binding";
        }
    }
}

flow token_ref_invalid(result: Result<GitHubTokenRef, AuthError>) -> bool ![] {
    match result {
        Ok(token) => {
            return false;
        }
        Err(error) => {
            return error.message == "invalid GitHub token reference";
        }
    }
}

flow main(args: Array<string>) -> i32 ![Error<GitHubError>] {
    let repo_result = github_repo("etas-lang", "etas");
    let repo = must_repo(repo_result);
    let bad_repo = github_repo("../owner", "etas");
    let space_repo = github_repo("etas lang", "etas");
    let query_repo = github_repo("etas-lang", "etas?token=x");
    let at_repo = github_repo("etas@lang", "etas");
    let backslash_repo = github_repo("etas\\lang", "etas");
    let colon_repo = github_repo("etas:lang", "etas");
    let tab_repo = github_repo("etas\tlang", "etas");
    let enterprise_result = github_enterprise_repo("etas-lang", "edk", "github.example.com");
    let enterprise = must_repo(enterprise_result);
    let bad_enterprise = github_enterprise_repo("etas-lang", "edk", "github.example.com/path");
    let space_enterprise = github_enterprise_repo("etas-lang", "edk", "bad host");
    let query_enterprise = github_enterprise_repo("etas-lang", "edk", "github.example.com?token=x");
    let backslash_enterprise = github_enterprise_repo("etas-lang", "edk", "github\\example.com");
    let colon_enterprise = github_enterprise_repo("etas-lang", "edk", "github.example.com:443");
    let at_enterprise = github_enterprise_repo("etas-lang", "edk", "token@github.example.com");
    let double_dot_enterprise = github_enterprise_repo("etas-lang", "edk", "github..example.com");
    let leading_dot_enterprise = github_enterprise_repo("etas-lang", "edk", ".github.example.com");
    let trailing_dot_enterprise = github_enterprise_repo("etas-lang", "edk", "github.example.com.");
    let leading_dash_enterprise = github_enterprise_repo("etas-lang", "edk", "-github.example.com");
    let trailing_dash_enterprise = github_enterprise_repo("etas-lang", "edk", "github-.example.com");
    let tab_enterprise = github_enterprise_repo("etas-lang", "edk", "github\texample.com");
    let draft = with_idempotency_key(with_label(issue_draft("Bug", "body"), "bug"), "edk-github-smoke");
    let bad_title = issue_draft("Bug\nTitle", "body");
    let bad_label = with_label(issue_draft("Bug", "body"), "  ");
    let tab_label = with_label(issue_draft("Bug", "body"), "bug\tlabel");
    let missing_key = with_label(issue_draft("Bug", "body"), "bug");
    let space_key = with_idempotency_key(with_label(issue_draft("Bug", "body"), "bug"), "bad key");
    let path_key = with_idempotency_key(with_label(issue_draft("Bug", "body"), "bug"), "bad/key");
    let tab_key = with_idempotency_key(with_label(issue_draft("Bug", "body"), "bug"), "bad\tkey");
    let head_result = branch_ref("feature");
    let head = must_branch(head_result);
    let base_result = branch_ref("main");
    let base = must_branch(base_result);
    let docs_branch_result = branch_ref("feature/docs");
    let docs_branch = must_branch(docs_branch_result);
    let pr_result = pull_request(repo, 7, head, base);
    let pr = must_pr(pr_result);
    let branch_pr = pull_request(repo, 8, docs_branch, base);
    let bad_pr = pull_request(repo, 0, head, base);
    let leading_slash_branch = branch_ref("/feature");
    let trailing_slash_branch = branch_ref("feature/");
    let empty_component_branch = branch_ref("feature//docs");
    let dot_component_branch = branch_ref("feature/.hidden");
    let lock_component_branch = branch_ref("feature/main.lock");
    let reflog_branch = branch_ref("feature@{1}");
    let wildcard_branch = branch_ref("feature/*");
    let revision_branch = branch_ref("feature~1");
    let colon_branch = branch_ref("owner:feature");
    let tab_branch = branch_ref("feature\tbad");
    let review_path_result = review_path("src/main.es");
    let review_file = must_review_path(review_path_result);
    let review_result = review_comment(review_file, 10, "comment");
    let review = must_review(review_result);
    let bad_review = review_comment(review_file, 0, "");
    let trailing_dotdot_review_path = review_path("src/..");
    let backslash_review_path = review_path("src\\secret");
    let drive_review_path = review_path("C:secret");
    let tab_review_path = review_path("src\tsecret");
    let issue_request = must_request(create_issue_request(repo, draft));
    let comment_request = must_request(pr_comment_request(repo, pr, review));
    let pr_request = must_request(get_pr_request(repo, pr));
    let pr_read_query_result = pr_query(pr);
    let pr_read_query = must_query(pr_read_query_result);
    let source_path_result = rest_path("src/main.es");
    let source_path = must_rest_path(source_path_result);
    let empty_path = must_rest_path(rest_path(""));
    let bad_query = query("pull_request", 0, empty_path);
    let source_query = query("pull_request", 7, source_path);
    let absolute_query_path = rest_path("/secret");
    let trailing_dotdot_query_path = rest_path("src/..");
    let backslash_query_path = rest_path("src\\secret");
    let drive_query_path = rest_path("C:secret");
    let tab_query_path = rest_path("src\tsecret");
    let query_request = must_request(read_query_request(repo, pr_read_query));
    let good_signature = verify_signature_header("sha256=abc");
    let bad_signature = verify_signature_header("sha1=abc");
    let empty_signature = verify_signature_header("sha256=");
    let tab_signature = verify_signature_header("sha256=abc\tdef");
    let issue = issue_ref(repo, 42);
    let comment = comment_ref("c-1", "https://example.invalid/comments/c-1");
    let result = api_result(repo, "pull_request", "body");
    let token_result = token_ref("github.token", "default");
    let default_token_result = default_token_ref("default");
    let bad_token_key = token_ref("../github.token", "default");
    let bad_token_account = token_ref("github.token", "default/account");

    if github_repo_value(repo).owner != "etas-lang" { return 1; }
    if rest_path_value(repo_path(repo)) != "repos/etas-lang/etas" { return 1; }
    if !repo_ok(repo_result) { return 1; }
    if repo_ok(bad_repo) { return 1; }
    if repo_ok(space_repo) { return 1; }
    if repo_ok(query_repo) { return 1; }
    if repo_ok(at_repo) { return 1; }
    if repo_ok(backslash_repo) { return 1; }
    if repo_ok(colon_repo) { return 1; }
    if repo_ok(tab_repo) { return 1; }
    if github_repo_value(enterprise).api_host != "github.example.com" { return 1; }
    if !repo_ok(enterprise_result) { return 1; }
    if repo_ok(bad_enterprise) { return 1; }
    if repo_ok(space_enterprise) { return 1; }
    if repo_ok(query_enterprise) { return 1; }
    if repo_ok(backslash_enterprise) { return 1; }
    if repo_ok(colon_enterprise) { return 1; }
    if repo_ok(at_enterprise) { return 1; }
    if repo_ok(double_dot_enterprise) { return 1; }
    if repo_ok(leading_dot_enterprise) { return 1; }
    if repo_ok(trailing_dot_enterprise) { return 1; }
    if repo_ok(leading_dash_enterprise) { return 1; }
    if repo_ok(trailing_dash_enterprise) { return 1; }
    if repo_ok(tab_enterprise) { return 1; }
    if draft.idempotency_key != "edk-github-smoke" { return 1; }
    if count_labels(draft) != 1 { return 1; }
    if !is_valid_idempotency_key(draft.idempotency_key) { return 1; }
    if !is_valid_issue_draft(draft) { return 1; }
    if is_valid_issue_draft(bad_title) { return 1; }
    if is_valid_issue_draft(bad_label) { return 1; }
    if is_valid_issue_draft(tab_label) { return 1; }
    if is_valid_issue_draft(missing_key) { return 1; }
    if is_valid_issue_draft(space_key) { return 1; }
    if is_valid_issue_draft(path_key) { return 1; }
    if is_valid_issue_draft(tab_key) { return 1; }
    if is_valid_idempotency_key("bad key") { return 1; }
    if is_valid_idempotency_key("bad\tkey") { return 1; }
    if pull_request_value(pr).number != 7 { return 1; }
    if branch_ref_value(head).name != "feature" { return 1; }
    if !branch_ok(head_result) { return 1; }
    if !branch_ok(base_result) { return 1; }
    if !branch_ok(docs_branch_result) { return 1; }
    if !pr_ok(pr_result) { return 1; }
    if !pr_ok(branch_pr) { return 1; }
    if !is_safe_ref_name("feature/docs") { return 1; }
    if !is_safe_ref_name("feature/docs-v2") { return 1; }
    if pr_ok(bad_pr) { return 1; }
    if branch_ok(leading_slash_branch) { return 1; }
    if branch_ok(trailing_slash_branch) { return 1; }
    if branch_ok(empty_component_branch) { return 1; }
    if branch_ok(dot_component_branch) { return 1; }
    if branch_ok(lock_component_branch) { return 1; }
    if branch_ok(reflog_branch) { return 1; }
    if branch_ok(wildcard_branch) { return 1; }
    if branch_ok(revision_branch) { return 1; }
    if branch_ok(colon_branch) { return 1; }
    if branch_ok(tab_branch) { return 1; }
    if is_safe_ref_name("feature/name^1") { return 1; }
    if is_safe_ref_name("feature/[bad]") { return 1; }
    if is_safe_ref_name("feature\tbad") { return 1; }
    if review_path_value(review_comment_value(review).path) != "src/main.es" { return 1; }
    if !review_path_ok(review_path_result) { return 1; }
    if !review_ok(review_result) { return 1; }
    if review_ok(bad_review) { return 1; }
    if review_path_ok(trailing_dotdot_review_path) { return 1; }
    if review_path_ok(backslash_review_path) { return 1; }
    if review_path_ok(drive_review_path) { return 1; }
    if review_path_ok(tab_review_path) { return 1; }
    if issue_request.method != "POST" { return 1; }
    if rest_path_value(issue_request.path) != "repos/etas-lang/etas/issues" { return 1; }
    if rest_path_value(comment_request.path) != "repos/etas-lang/etas/pulls/7/comments" { return 1; }
    if rest_path_value(pr_request.path) != "repos/etas-lang/etas/pulls/7" { return 1; }
    if query_request.method != "GET" { return 1; }
    if !query_ok(pr_read_query_result) { return 1; }
    if query_ok(bad_query) { return 1; }
    if !query_ok(source_query) { return 1; }
    if !rest_path_ok(source_path_result) { return 1; }
    if rest_path_ok(absolute_query_path) { return 1; }
    if rest_path_ok(trailing_dotdot_query_path) { return 1; }
    if rest_path_ok(backslash_query_path) { return 1; }
    if rest_path_ok(drive_query_path) { return 1; }
    if rest_path_ok(tab_query_path) { return 1; }
    if !is_safe_repo_path("src/main.es") { return 1; }
    if is_safe_repo_path("/secret") { return 1; }
    if is_safe_repo_path("src/..") { return 1; }
    if is_safe_repo_path("src\\secret") { return 1; }
    if is_safe_repo_path("C:secret") { return 1; }
    if is_safe_repo_path("src\tsecret") { return 1; }
    if !good_signature.ok { return 1; }
    if bad_signature.ok { return 1; }
    if empty_signature.ok { return 1; }
    if tab_signature.ok { return 1; }
    if issue.number != 42 { return 1; }
    if comment.id != "c-1" { return 1; }
    if result.rate_limit.remaining != 4999 { return 1; }
    if !token_ref_blocked(token_result) { return 1; }
    if !token_ref_blocked(default_token_result) { return 1; }
    if !token_ref_invalid(bad_token_key) { return 1; }
    if !token_ref_invalid(bad_token_account) { return 1; }
    return 0;
}

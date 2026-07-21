module tests.edk.tool_mock_surface.email_github.main;

import edk.email.address.{email_account, email_address, is_valid_address};
import edk.email.effects.EdkEmail;
import edk.email.errors.{AddressError, EmailError};
import edk.email.message.with_idempotency_key;
import edk.email.mocks.mailbox.{accepted_receipt, empty_mailbox_page};
import edk.email.tools.mail.{draft_email, search_mailbox, send_email};
import edk.email.types.{EmailAccount, EmailAddress};
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.issue.{count_labels, issue_draft, is_valid_issue_draft, with_idempotency_key as github_issue_idempotency_key, with_label};
import edk.github.mocks.api.{api_result, comment_ref, issue_ref};
import edk.github.pr.{branch_ref, is_valid_pull_request, pull_request, review_comment, review_path};
import edk.github.repo.{github_repo, is_valid_repo_ref};
import edk.github.types.{BranchRef, GitHubRepoRef, PullRequestRef, ReviewComment, ReviewPath};
import edk.github.tools.issues.create_issue;
import edk.github.tools.prs.{comment_on_pr, read_pr};

flow must_address(result: Result<EmailAddress, AddressError>) -> EmailAddress ![Error<AddressError>] {
    match result {
        Ok(address) => {
            return address;
        }
        Err(error) => {
            return perform Error<AddressError>.raise(error);
        }
    }
}

flow must_account(result: Result<EmailAccount, EmailError>) -> EmailAccount ![Error<EmailError>] {
    match result {
        Ok(account) => {
            return account;
        }
        Err(error) => {
            return perform Error<EmailError>.raise(error);
        }
    }
}

flow checked_github_repo(owner: string, name: string) -> GitHubRepoRef ![Error<GitHubError>] {
    return match github_repo(owner, name) {
        Ok(repo) => repo,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_branch_ref(value: string) -> BranchRef ![Error<GitHubError>] {
    return match branch_ref(value) {
        Ok(branch) => branch,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_pull_request(repo: GitHubRepoRef, number: i32, head: BranchRef, base: BranchRef) -> PullRequestRef<GitHubRepoRef, BranchRef, BranchRef> ![Error<GitHubError>] {
    return match pull_request(repo, number, head, base) {
        Ok(pr) => pr,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_review_path(value: string) -> ReviewPath ![Error<GitHubError>] {
    return match review_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_review_comment(path: ReviewPath, line: i32, body: string) -> ReviewComment<ReviewPath> ![Error<GitHubError>] {
    return match review_comment(path, line, body) {
        Ok(comment) => comment,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkEmail.send, EdkEmail.read, EdkGitHub.issue_create, EdkGitHub.pr_comment, EdkGitHub.read, Secret.read, Error<AddressError>, Error<EmailError>, Error<GitHubError>] {
    let recipient = must_address(email_address("EDK", "edk@example.com"));
    let account = must_account(email_account("fixtures", "mock", recipient));
    let draft = with_idempotency_key(draft_email(recipient, "Report", "ready"), "fixture-report-1");
    let receipt = send_email(account, draft);
    let messages = search_mailbox(account, "inbox", "report", 10);
    let empty_mailbox = empty_mailbox_page();
    let accepted = accepted_receipt(account, draft, "provider-1");

    let repo = checked_github_repo("etas", "edk");
    let issue = github_issue_idempotency_key(with_label(issue_draft("Fixture issue", "body"), "test"), "tool-mock-issue");
    let created = create_issue(repo, issue);
    let head = checked_branch_ref("feature/edk");
    let base = checked_branch_ref("main");
    let pr = checked_pull_request(repo, 7, head, base);
    let comment_path = checked_review_path("src/main.es");
    let review = checked_review_comment(comment_path, 12, "Looks consistent");
    let comment = comment_on_pr(repo, pr, review);
    let pr_result = read_pr(repo, pr);
    let mock_issue = issue_ref(repo, 1);
    let mock_comment = comment_ref("comment-1", "https://example.invalid/comment/1");
    let mock_result = api_result(repo, "pull_request", "{}");

    if !is_valid_address(recipient) { return 1; }
    if draft.idempotency_key != "fixture-report-1" { return 1; }
    if !accepted.accepted { return 1; }
    if !empty_mailbox.done { return 1; }
    if receipt.provider_message_id != receipt.provider_message_id { return 1; }
    if messages != messages { return 1; }
    if !is_valid_repo_ref(repo) { return 1; }
    if !is_valid_issue_draft(issue) { return 1; }
    if count_labels(issue) != 1 { return 1; }
    if !is_valid_pull_request(pr) { return 1; }
    if created.number != created.number { return 1; }
    if comment.id != comment.id { return 1; }
    if pr_result.kind != pr_result.kind { return 1; }
    if mock_issue.number != 1 { return 1; }
    if mock_comment.id != "comment-1" { return 1; }
    if mock_result.rate_limit.remaining != 4999 { return 1; }
    return 0;
}

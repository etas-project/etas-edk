module tests.edk.negative.edk_github_raw_repo_forbidden.main;

import edk.github.issue.{issue_draft, with_idempotency_key};
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.tools.issues.create_issue;

flow main(args: Array<string>) -> i32 ![EdkGitHub.issue_create, Secret.read, Error<GitHubError>] {
    let issue = with_idempotency_key(issue_draft("Bug", "body"), "raw-repo-forbidden");
    let created = create_issue("etas-lang/etas", issue);
    return created.number;
}

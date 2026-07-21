module tests.edk.negative.edk_github_raw_repo_constructor_forbidden.main;

import edk.github.issue.{issue_draft, with_idempotency_key};
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.tools.issues.create_issue;
import edk.github.types.{GitHubRepoRef, GitHubRepoSpec};

flow main(args: Array<string>) -> i32 ![EdkGitHub.issue_create, Secret.read, Error<GitHubError>] {
    let spec = GitHubRepoSpec {
        owner = "../owner",
        name = "etas",
        api_host = "api.github.com",
    };
    let repo = GitHubRepoRef(spec);
    let issue = with_idempotency_key(issue_draft("Bug", "body"), "raw-repo-constructor-forbidden");
    let created = create_issue(repo, issue);
    return created.number;
}

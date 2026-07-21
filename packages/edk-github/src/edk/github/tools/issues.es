module edk.github.tools.issues;

import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.issue.create_issue as create_issue_flow;
import edk.github.types.{GitHubTarget, IssueDraft, IssueRef};

public tool create_issue<R ~ GitHubTarget>(repo: R, draft: IssueDraft) -> IssueRef<R> ![EdkGitHub.issue_create<R>, Secret.read, Error<GitHubError>] {
    return create_issue_flow(repo, draft);
}

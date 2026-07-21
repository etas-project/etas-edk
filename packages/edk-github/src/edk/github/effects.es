module edk.github.effects;

import edk.github.types.{CommentRef, GitHubPullRequestTarget, GitHubQuery, GitHubRestPath, GitHubResult, GitHubReviewPath, GitHubTarget, IssueDraft, IssueRef, PullRequestRef, ReviewComment};

public effect EdkGitHub extends Network {
    action issue_create<R ~ GitHubTarget>(repo: R, draft: IssueDraft) -> IssueRef<R>;
    action pr_comment<R ~ GitHubTarget, P ~ GitHubPullRequestTarget<R>, C ~ GitHubReviewPath>(repo: R, pr: P, comment: ReviewComment<C>) -> CommentRef;
    action read<R ~ GitHubTarget>(repo: R, query: GitHubQuery<GitHubRestPath>) -> GitHubResult<R>;
}

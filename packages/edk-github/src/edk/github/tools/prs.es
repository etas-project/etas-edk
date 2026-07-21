module edk.github.tools.prs;

import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.pr.{comment_pr as comment_pr_flow, get_pr as get_pr_flow};
import edk.github.types.{CommentRef, GitHubBranchRef, GitHubPullRequestTarget, GitHubResult, GitHubReviewPath, GitHubTarget, PullRequestRef, ReviewComment};

public tool comment_on_pr<R ~ GitHubTarget, P ~ GitHubPullRequestTarget<R>, C ~ GitHubReviewPath>(repo: R, pr: P, comment: ReviewComment<C>) -> CommentRef ![EdkGitHub.pr_comment<R>, Secret.read, Error<GitHubError>] {
    return comment_pr_flow(repo, pr, comment);
}

public tool read_pr<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>(repo: R, pr: PullRequestRef<R, H, B>) -> GitHubResult<R> ![EdkGitHub.read<R>, Secret.read, Error<GitHubError>] {
    return get_pr_flow(repo, pr);
}

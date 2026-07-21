module edk.github.mocks.api;

import edk.github.repo.{empty_result, github_result, rate_limit};
import edk.github.types.{CommentRef, GitHubRepoRef, GitHubResult, IssueRef};

public flow empty_api_result(repo: GitHubRepoRef, kind: string) -> GitHubResult<GitHubRepoRef> ![] {
    return empty_result(repo, kind);
}

public flow api_result(repo: GitHubRepoRef, kind: string, body: string) -> GitHubResult<GitHubRepoRef> ![] {
    return github_result(repo, kind, body, rate_limit(5000, 4999, ""));
}

public flow issue_ref(repo: GitHubRepoRef, number: i32) -> IssueRef<GitHubRepoRef> ![] {
    return IssueRef<GitHubRepoRef> {
        repo = repo,
        number = number,
        url = "",
    };
}

public flow comment_ref(id: string, url: string) -> CommentRef ![] {
    return CommentRef {
        id = id,
        url = url,
    };
}

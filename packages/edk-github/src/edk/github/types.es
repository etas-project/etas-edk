module edk.github.types;

import std.secret.SecretKey;

public alias GitHubRepoSpec = {
    owner: string,
    name: string,
    api_host: string,
};

public type GitHubRepoRef = GitHubRepoSpec;

public spec GitHubTarget;

impl GitHubRepoRef ~ GitHubTarget;

public alias BranchSpec = {
    name: string,
};

public type BranchRef = BranchSpec;

public spec GitHubBranchRef;

impl BranchRef ~ GitHubBranchRef;

public type GitHubToken;
public alias GitHubTokenRef = SecretKey<GitHubToken>;

public spec GitHubSecret;

impl GitHubTokenRef ~ GitHubSecret;

public alias IssueDraft = {
    title: string,
    body: string,
    labels: Array<string>,
    idempotency_key: string,
};

public alias IssueRef<R ~ GitHubTarget> = {
    repo: R,
    number: i32,
    url: string,
};

public alias PullRequestSpec<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef> = {
    repo: R,
    number: i32,
    head: H,
    base: B,
};

public type PullRequestRef<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef> = PullRequestSpec<R, H, B>;

public spec GitHubPullRequestTarget<R ~ GitHubTarget>;

impl PullRequestRef<GitHubRepoRef, BranchRef, BranchRef> ~ GitHubPullRequestTarget<GitHubRepoRef>;

public alias GitHubRestPathSpec = {
    value: string,
};

public type GitHubRestPath = GitHubRestPathSpec;

public spec GitHubRestRoute;

impl GitHubRestPath ~ GitHubRestRoute;

public alias CommentRef = {
    id: string,
    url: string,
};

public alias GitHubQuery<P ~ GitHubRestRoute> = {
    kind: string,
    number: i32,
    path: P,
};

public alias ReviewPathSpec = {
    value: string,
};

public type ReviewPath = ReviewPathSpec;

public spec GitHubReviewPath;

impl ReviewPath ~ GitHubReviewPath;

public alias ReviewCommentSpec<P ~ GitHubReviewPath> = {
    path: P,
    line: i32,
    body: string,
};

public type ReviewComment<P ~ GitHubReviewPath> = ReviewCommentSpec<P>;

public alias RateLimitState = {
    quota: i32,
    remaining: i32,
    reset_at: string,
};

public alias GitHubResult<R ~ GitHubTarget> = {
    repo: R,
    kind: string,
    body: string,
    rate_limit: RateLimitState,
};

public alias RestRequestSpec<P ~ GitHubRestRoute> = {
    method: string,
    path: P,
    body: string,
};

public alias WebhookVerification = {
    ok: bool,
    message: string,
};

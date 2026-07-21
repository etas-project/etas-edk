module edk.github.errors;

public type GitHubError = {
    code: string,
    message: string,
};

public type AuthError = {
    account: string,
    message: string,
};

public type RateLimitError = {
    remaining: i32,
    reset_at: string,
    message: string,
};

public type ApiError = {
    status: i32,
    message: string,
};

public type WebhookError = {
    message: string,
};

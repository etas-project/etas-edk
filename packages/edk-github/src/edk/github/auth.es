module edk.github.auth;

import std.text.{contains, trim};
import edk.github.errors.AuthError;
import edk.github.types.GitHubTokenRef;

flow auth_error(account: string, message: string) -> AuthError ![] {
    return AuthError {
        account = trim(account),
        message = message,
    };
}

flow is_safe_token_part(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, ":")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

public flow token_ref(key: string, account: string) -> Result<GitHubTokenRef, AuthError> ![] {
    if !is_safe_token_part(key) || !is_safe_token_part(account) {
        return Err(auth_error(account, "invalid GitHub token reference"));
    }
    return Err(auth_error(account, "GitHub token references require SecretKey<GitHubToken> binding"));
}

public flow default_token_ref(account: string) -> Result<GitHubTokenRef, AuthError> ![] {
    return token_ref("github.token", account);
}

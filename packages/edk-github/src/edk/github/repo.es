module edk.github.repo;

import std.text.{contains, join, split, starts_with, trim};
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.types.{GitHubQuery, GitHubRepoRef, GitHubRepoSpec, GitHubRestPath, GitHubRestPathSpec, GitHubRestRoute, GitHubResult, GitHubTarget, RateLimitState};

flow github_error(code: string, message: string) -> GitHubError ![] {
    return GitHubError {
        code = code,
        message = message,
    };
}

flow raw_github_repo(owner: string, name: string, api_host: string) -> GitHubRepoSpec ![] {
    return GitHubRepoSpec {
        owner = trim(owner),
        name = trim(name),
        api_host = trim(api_host),
    };
}

flow raw_github_repo_ref(repo: GitHubRepoSpec) -> GitHubRepoRef ![] {
    return GitHubRepoRef(repo);
}

public flow github_repo(owner: string, name: string) -> Result<GitHubRepoRef, GitHubError> ![] {
    return github_enterprise_repo(owner, name, "api.github.com");
}

public flow github_enterprise_repo(owner: string, name: string, api_host: string) -> Result<GitHubRepoRef, GitHubError> ![] {
    let repo = raw_github_repo(owner, name, api_host);
    if !is_valid_repo_spec(repo) {
        return Err(github_error("invalid_repo", "invalid GitHub repository reference"));
    }
    return Ok(raw_github_repo_ref(repo));
}

public flow github_repo_value(repo: GitHubRepoRef) -> GitHubRepoSpec ![] {
    return repo;
}

flow raw_rest_path(value: string) -> GitHubRestPathSpec ![] {
    return GitHubRestPathSpec {
        value = trim(value),
    };
}

flow raw_rest_path_ref(path: GitHubRestPathSpec) -> GitHubRestPath ![] {
    return GitHubRestPath(path);
}

public flow rest_path(value: string) -> Result<GitHubRestPath, GitHubError> ![] {
    let path = raw_rest_path(value);
    if !is_valid_rest_path_spec(path) {
        return Err(github_error("invalid_rest_path", "invalid GitHub REST path"));
    }
    return Ok(raw_rest_path_ref(path));
}

public flow rest_path_value(path: GitHubRestPath) -> string ![] {
    let value: GitHubRestPathSpec = path;
    return value.value;
}

public flow repo_path(repo: GitHubRepoRef) -> GitHubRestPath ![] {
    let value = github_repo_value(repo);
    let parts: Array<string> = ["repos", value.owner, value.name];
    return raw_rest_path_ref(raw_rest_path(join(parts, "/")));
}

flow ends_with_text(value: string, suffix: string) -> bool ![] {
    if suffix == "" {
        return true;
    }
    if !contains(value, suffix) {
        return false;
    }
    var last = value;
    for part in split(value, suffix) limit Iterations(65536) {
        last = part;
    }
    return last == "";
}

public flow is_safe_path_segment(value: string) -> bool ![] {
    let segment = trim(value);
    return segment != ""
        && !contains(segment, "/")
        && !contains(segment, "..")
        && !contains(segment, "\\")
        && !contains(segment, ":")
        && !contains(segment, " ")
        && !contains(segment, "?")
        && !contains(segment, "#")
        && !contains(segment, "@")
        && !contains(segment, "\n")
        && !contains(segment, "\r")
        && !contains(segment, "\t");
}

flow is_safe_host_label(label: string) -> bool ![] {
    return label != ""
        && !starts_with(label, "-")
        && !ends_with_text(label, "-");
}

flow is_safe_api_host(host: string) -> bool ![] {
    let value = trim(host);
    if value == "" || starts_with(value, ".") || ends_with_text(value, ".") {
        return false;
    }
    if contains(value, " ")
        || contains(value, "/")
        || contains(value, "\\")
        || contains(value, ":")
        || contains(value, "?")
        || contains(value, "#")
        || contains(value, "@")
        || contains(value, "..")
        || contains(value, "\n")
        || contains(value, "\r")
        || contains(value, "\t")
    {
        return false;
    }
    for label in split(value, ".") limit Iterations(128) {
        if !is_safe_host_label(label) {
            return false;
        }
    }
    return true;
}

public flow is_valid_repo_ref(repo: GitHubRepoRef) -> bool ![] {
    return is_valid_repo_spec(github_repo_value(repo));
}

public flow is_valid_repo_spec(repo: GitHubRepoSpec) -> bool ![] {
    return is_safe_path_segment(repo.owner)
        && is_safe_path_segment(repo.name)
        && is_safe_api_host(repo.api_host);
}

flow raw_query<P ~ GitHubRestRoute>(kind: string, number: i32, path: P) -> GitHubQuery<P> ![] {
    return GitHubQuery<P> {
        kind = trim(kind),
        number = number,
        path = path,
    };
}

public flow query<P ~ GitHubRestRoute>(kind: string, number: i32, path: P) -> Result<GitHubQuery<P>, GitHubError> ![] {
    let value = raw_query(kind, number, path);
    if !is_valid_query(value) {
        return Err(github_error("invalid_query", "invalid GitHub query"));
    }
    return Ok(value);
}

public flow is_valid_query<P ~ GitHubRestRoute>(query: GitHubQuery<P>) -> bool ![] {
    return is_safe_path_segment(query.kind)
        && query.number > 0;
}

public flow is_valid_rest_path(path: GitHubRestPath) -> bool ![] {
    let value: GitHubRestPathSpec = path;
    return is_valid_rest_path_spec(value);
}

public flow is_valid_rest_path_spec(path: GitHubRestPathSpec) -> bool ![] {
    return is_safe_repo_path(path.value);
}

public flow is_safe_repo_path(path: string) -> bool ![] {
    let value = trim(path);
    if value == "" {
        return true;
    }
    if starts_with(value, "/") {
        return false;
    }
    if contains(value, "\\") || contains(value, ":") {
        return false;
    }
    if contains(value, "\n") || contains(value, "\r") || contains(value, "\t") {
        return false;
    }
    for part in split(value, "/") limit Iterations(128) {
        if part == ".." {
            return false;
        }
    }
    return true;
}

public flow empty_rate_limit() -> RateLimitState ![] {
    return RateLimitState {
        quota = 0,
        remaining = 0,
        reset_at = "",
    };
}

public flow rate_limit(quota: i32, remaining: i32, reset_at: string) -> RateLimitState ![] {
    return RateLimitState {
        quota = quota,
        remaining = remaining,
        reset_at = trim(reset_at),
    };
}

public flow github_result<R ~ GitHubTarget>(repo: R, kind: string, body: string, rate_limit: RateLimitState) -> GitHubResult<R> ![] {
    return GitHubResult<R> {
        repo = repo,
        kind = trim(kind),
        body = body,
        rate_limit = rate_limit,
    };
}

public flow empty_result<R ~ GitHubTarget>(repo: R, kind: string) -> GitHubResult<R> ![] {
    return github_result(repo, kind, "", empty_rate_limit());
}

public flow read<R ~ GitHubTarget>(repo: R, query: GitHubQuery<GitHubRestPath>) -> GitHubResult<R> ![EdkGitHub.read<R>, Secret.read, Error<GitHubError>] {
    return perform EdkGitHub.read(repo, query);
}

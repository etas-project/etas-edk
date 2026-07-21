module edk.github.issue;

import std.text.{contains, trim};
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.types.{GitHubTarget, IssueDraft, IssueRef};

flow github_error(code: string, message: string) -> GitHubError ![] {
    return GitHubError {
        code = code,
        message = message,
    };
}

public flow issue_draft(title: string, body: string) -> IssueDraft ![] {
    let labels: Array<string> = [];
    return IssueDraft {
        title = trim(title),
        body = body,
        labels = labels,
        idempotency_key = "",
    };
}

public flow with_label(draft: IssueDraft, label: string) -> IssueDraft ![] {
    return IssueDraft {
        title = draft.title,
        body = draft.body,
        labels = draft.labels.push(trim(label)),
        idempotency_key = draft.idempotency_key,
    };
}

public flow with_idempotency_key(draft: IssueDraft, key: string) -> IssueDraft ![] {
    return IssueDraft {
        title = draft.title,
        body = draft.body,
        labels = draft.labels,
        idempotency_key = trim(key),
    };
}

public flow count_labels(draft: IssueDraft) -> i32 ![] {
    var total = 0;
    for label in draft.labels limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow is_valid_label(label: string) -> bool ![] {
    let value = trim(label);
    return value != ""
        && !contains(value, "\n")
        && !contains(value, "\r")
        && !contains(value, "\t");
}

public flow is_valid_idempotency_key(key: string) -> bool ![] {
    let value = trim(key);
    return value != ""
        && !contains(value, " ")
        && !contains(value, "/")
        && !contains(value, "\\")
        && !contains(value, "?")
        && !contains(value, "#")
        && !contains(value, "\n")
        && !contains(value, "\r")
        && !contains(value, "\t");
}

public flow is_valid_issue_draft(draft: IssueDraft) -> bool ![] {
    if draft.title == ""
        || contains(draft.title, "\n")
        || contains(draft.title, "\r")
        || !is_valid_idempotency_key(draft.idempotency_key)
    {
        return false;
    }
    for label in draft.labels limit Iterations(65536) {
        if !is_valid_label(label) {
            return false;
        }
    }
    return true;
}

flow raise_github_error(error: GitHubError) -> never ![Error<GitHubError>] {
    return perform Error<GitHubError>.raise(error);
}

public flow create_issue<R ~ GitHubTarget>(repo: R, draft: IssueDraft) -> IssueRef<R> ![EdkGitHub.issue_create<R>, Secret.read, Error<GitHubError>] {
    if !is_valid_issue_draft(draft) {
        return raise_github_error(github_error("invalid_issue_draft", "invalid GitHub issue draft"));
    }
    return perform EdkGitHub.issue_create(repo, draft);
}

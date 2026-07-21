module edk.git.commit;

import std.text.{contains, trim};
import edk.git.effects.EdkGit;
import edk.git.errors.GitError;
import edk.git.patch.patch;
import edk.git.types.{CommitMessage, CommitReceipt, GitChange, GitRepoRef};

public flow commit_message(subject: string, body: string) -> CommitMessage ![] {
    return CommitMessage {
        subject = trim(subject),
        body = body,
    };
}

public flow is_valid_commit_message(message: CommitMessage) -> bool ![] {
    return message.subject != ""
        && !contains(message.subject, "\n")
        && !contains(message.subject, "\r")
        && !contains(message.body, "\r");
}

public flow commit_change(message: CommitMessage) -> GitChange ![] {
    return GitChange {
        kind = "commit",
        patch = patch(""),
        message = message,
    };
}

public flow commit(repo: GitRepoRef, message: CommitMessage) -> CommitReceipt ![EdkGit.write, Error<GitError>] {
    return perform EdkGit.write(repo, commit_change(message));
}

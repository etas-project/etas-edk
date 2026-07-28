module edk.git.handlers.default;

import edk.git.errors.GitError;
import edk.git.repo.git_repo_value;
import edk.git.types.{GitRepoRef, Patch};

public flow git_repo_path(repo: GitRepoRef) -> string ![] {
    return git_repo_value(repo).path;
}

// EdkGitDefault — command-based handler (SPEC target, blocked by substrate)
//
// Intended type signature:
//
//   let EdkGitDefault:
//       ![EdkGit.read, EdkGit.write => Command.run[_], Error<GitError>]
//       = handler {
//       EdkGit.read(repo) => {
//           let preflight = preflight_read(repo);
//           if !preflight.ok { /* raise error */ }
//           let path = git_repo_path(repo);
//           let status_cmd = Command { argv = ["git", "-C", path, "status", "--porcelain=v1"], ... };
//           let status_result = std.host.command.run(status_cmd, DefaultCommandSandbox);
//           let diff_cmd = Command { argv = ["git", "-C", path, "diff"], ... };
//           let diff_result = std.host.command.run(diff_cmd, DefaultCommandSandbox);
//           let status = parse_porcelain_status(status_result.stdout);
//           let diff = parse_file_headers(diff_result.stdout);
//           resume GitReadResult { status = status, diff = diff };
//       }
//       EdkGit.write(repo, change) => {
//           let preflight = preflight_write(repo, change);
//           if !preflight.ok { /* raise error */ }
//           let path = git_repo_path(repo);
//           if change.kind == "patch" {
//               let cmd = Command { argv = ["git", "-C", path, "apply"], stdin = change.patch.text, ... };
//               let result = std.host.command.run(cmd, DefaultCommandSandbox);
//           }
//           if change.kind == "commit" {
//               let cmd = Command { argv = ["git", "-C", path, "commit", "-m", change.message.subject, ...], ... };
//               let result = std.host.command.run(cmd, DefaultCommandSandbox);
//           }
//           resume GitWriteReceipt { repo = repo, change_kind = change.kind, message = change.message.subject };
//       }
//   };
//
// Blocked by: std.host.command.Command cannot be constructed in Etas source.
// See std-requirements/substrate-gaps.md "Command Value Construction".

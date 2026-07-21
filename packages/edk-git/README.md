# edk-git

Initial source modules:

- `edk.git.effects`
- `edk.git.types`
- `edk.git.errors`
- `edk.git.repo`
- `edk.git.diff`
- `edk.git.patch`
- `edk.git.commit`
- `edk.git.pure.diff_parse`
- `edk.git.pure.patch_validate`

`repo.status`, `diff.diff`, `patch.apply_patch`, and `commit.commit` expose the
package-owned `EdkGit.read` and `EdkGit.write` action boundaries. No default Git
handler, dry-run handler, or command fallback is published in this slice.

The architecture permits a future command-based default implementation only when
`Command.run[GitSandbox]` remains explicit and policy-visible. That default is
not implemented here.

Git repository, branch, remote, and status-entry values are now treated as
checked evidence values. Public constructors return `Result<...>` after
normalizing and validating runtime strings; package-internal raw constructors
remain private implementation details.

Package-mode verification is currently blocked by frontend nominal evidence
support. Representation-backed wrappers such as `GitRepoRef(GitRepoSpec)` /
`BranchRef(BranchSpec)` need constructor/accessor facts, and `CommitReceipt =
GitWriteReceipt` must remain transparent when a `EdkGit.write` action returns
`GitWriteReceipt`. The source intentionally stays at the SPEC target instead of
restoring unchecked constructors.

`edk.git.package_smoke` now covers deterministic diff header/hunk parsing,
patch path-token escape validation, segment-aware repository/status path
validation, conservative Git branch/ref token validation, remote reference name
and URL-shape validation, status constructors, commit-message validation, and
mock read/write receipt helpers. Patch and repository validation reject absolute
path tokens, standalone `..` path segments, backslash paths, drive-style/colon
paths, tab/control characters, and escaping rename targets while allowing
standard `/dev/null` file headers and non-parent names such as `..hidden`.
Branch/ref validation rejects
empty path components, leading/trailing slashes, dot-prefixed components,
trailing dot components, `.lock` components, reflog syntax, wildcard/revision
characters, tab characters, and parent-traversal-like `..`.
Remote URL validation accepts ordinary `http://`, `https://`, `ssh://`, and
`git@host:path` shapes while rejecting whitespace/control characters, embedded
HTTP credentials, empty HTTP hosts, query/fragment markers, and relative or
absolute remote path escapes. Status-entry validation rejects unsafe path tokens
and control characters in state labels. Commit-message validation rejects empty
subjects, subject CR/LF, and CR in the body.
The fixture
`tests/fixtures/positive/edk_git_pure_surface` mirrors that pure surface for
downstream package-style consumption. It is source-updated for checked evidence
constructors, but package-mode verification is blocked until the frontend can
emit and consume the nominal wrapper and alias facts described above.

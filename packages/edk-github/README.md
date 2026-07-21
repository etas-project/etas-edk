# edk-github

Initial source modules:

- `edk.github.effects`
- `edk.github.types`
- `edk.github.errors`
- `edk.github.auth`
- `edk.github.issue`
- `edk.github.pr`
- `edk.github.repo`
- `edk.github.pure.rest_encode`
- `edk.github.pure.webhook_verify`
- `edk.github.mocks.api`
- `edk.github.tools.issues`
- `edk.github.tools.prs`

`issue.create_issue`, `pr.comment_pr`, and `pr.get_pr` perform package-owned
`EdkGitHub.*` actions. They declare `Secret.read` in their public effect rows
because GitHub operations require token access, but this package does not
publish a default secret, HTTP, or GitHub API handler in this slice.

The current static selector form is `EdkGitHub.issue_create<R>`,
`EdkGitHub.pr_comment<R>`, and `EdkGitHub.read<R>`, where `R` is repository
evidence. Runtime repository strings stay in payload data. The package metadata
gap is tracked in `std-requirements/substrate-gaps.md`.

Default handlers over `edk-http` and local `edk-git` remain pending. Pure REST
encoding helpers do not execute network IO. `GitHubTokenRef` is a
`SecretKey<GitHubToken>` evidence alias, not a string token; current checked
token-ref helpers fail closed until source-level secret key construction/import
metadata is available. The package smoke asserts both valid-shaped token
references failing closed at that substrate boundary and malformed token
references being rejected as invalid input.

GitHub branch names are also evidence values. `branch_ref(value)` validates and
normalizes a raw string before producing `BranchRef`; `PullRequestRef<R, H, B>`
carries the repository and branch evidence types through PR APIs. The public
`pull_request(...)` constructor accepts `H: GitHubBranchRef` and
`B: GitHubBranchRef`, not raw strings. This keeps ref injection checks at the
constructor boundary instead of letting PR APIs consume unchecked branch text.

REST and review paths follow the same rule. `rest_path(value)` produces
`GitHubRestPath`, `review_path(value)` produces `ReviewPath`, and query / review
APIs consume those evidence values instead of raw strings. `GitHubQuery<P>`,
`ReviewComment<P>`, `GitHubResult<R>`, and `RestRequestSpec<P>` preserve the
route/repository evidence in their type arguments; pure REST planning returns
`Result<RestRequestSpec<GitHubRestPath>, GitHubError>` because request paths are
checked before they become `RestRequestSpec.path`. `IssueRef<R>` likewise keeps
the repository evidence that created the issue. The package no longer exposes a
separate `empty_rest_path()` constructor; internal empty-path use goes through
the same checked `rest_path("")` boundary.

Package-mode verification is currently blocked by dependency metadata:
`edk-github` depends on `edk-http` and `edk-git`/`edk-workspace`, and those
packages now expose nominal evidence and parameterized spec evidence source
that the current package manager cannot yet materialize. This is not a license
to reintroduce raw string token/repo APIs or fake GitHub/secret handlers.
Source-only checking is also currently blocked by frontend support for generic
effect action type parameters, applied nominal record constructors such as
`PullRequestRef<R, H, B> { ... }`, parameterized record field access, and
spec-bound dispatch through `GitHubPullRequestTarget<R>`.

`edk.github.package_smoke` now covers repository references with
conservative repo/API-host/path validation, issue draft labels/idempotency keys
with unsafe title/label/key rejection, PR/review comment validation, REST request
planning, webhook signature header shape checks, and deterministic mock API
refs/results. Repo and request paths reject absolute paths, `..` segments,
backslashes, colon-style path tokens, spaces, tab/control characters,
query/fragment markers, and `@` before REST paths are assembled. API hosts
reject spaces, tabs/control characters, slashes, backslashes, ports/colon
tokens, query/fragment markers, `@`, empty labels, leading/trailing dots,
double dots, and leading/trailing hyphen labels before they can become
repository-scope identity. Issue labels and idempotency keys reject tab/control
characters. Checked `BranchRef` construction rejects empty components,
leading/trailing slashes, dot-prefixed components, trailing dots, `.lock`
components, reflog syntax, wildcard/revision characters, tab/control
characters, and parent-like `..`. Checked `GitHubRestPath` / `ReviewPath`
construction rejects absolute paths, `..` segments, backslashes, drive/colon
tokens, and tab/control characters before REST request specs or review comments
can be assembled.

Action-level replay/idempotency metadata for `EdkGitHub.issue_create<R>` and
`EdkGitHub.pr_comment<R>` remains blocked in
`tests/blocked/edk-github-replay-metadata.txt`; the ordinary
`IssueDraft.idempotency_key` field is source data validation enforced by
`issue.create_issue` before requesting `EdkGitHub.issue_create`, and
`pr.comment_pr` now consumes checked `ReviewComment<...>` evidence before
requesting `EdkGitHub.pr_comment`, but neither is a complete package metadata
substitute. Full webhook HMAC verification is blocked
in `tests/blocked/edk-github-webhook-hmac.txt`; the pure helper must not be
treated as cryptographic verification. The fixture
`tests/fixtures/positive/edk_github_pure_surface` mirrors that pure surface for
downstream package-style consumption, including fail-closed token-ref assertions;
package-mode verification remains blocked
until dependency metadata for the nominal HTTP/workspace/Git surfaces can be
produced.

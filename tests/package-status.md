# Package Verification Status

This file tracks the current verification status without hiding package tooling
gaps behind hand-written metadata or fake dependencies.

## Nominal Safety Transition Status

The nominal evidence + spec evidence migration intentionally moves EDK source to
the SPEC target. Packages that still need frontend or package-manager support
are tracked as blocked instead of being weakened with transparent aliases,
hand-written metadata, fake handlers, or mock runtime fallbacks.

Current verified checks from this transition:

- `etas check tests/fixtures/positive/alias_transparent_host` passes;
- `etas check tests/fixtures/negative/nominal_type_rejects_raw_string` fails
  with the intended raw-string-to-nominal `TypeMismatch`.
- `tests/fixtures/negative/old_trait_keyword_forbidden` records that the old
  `trait` keyword must be rejected by the frontend.
- `etas check tests/fixtures/positive/spec_impl_canonical_evidence` passes for
  canonical `impl Type ~ Spec` evidence satisfying a `T ~ Spec` bound.
- `tests/fixtures/blocked/spec_impl_compat_equivalence` records the required
  compatibility behavior for `impl Spec for Type` normalizing to equivalent spec
  evidence. Current frontend behavior is still blocked: the compatibility value
  fails `T ~ Spec` dispatch with a `type::TypeMismatch`.
- `etas check --no-config /private/tmp/etas-branch-ref-check/main.es`
  passes for checked `BranchRef` evidence feeding a PR constructor.
- `etas check --no-config /private/tmp/etas-branch-ref-check/raw_string_forbidden.es`
  fails with the intended raw-string-to-`BranchRef` `TypeMismatch`.
- `etas check --no-config /private/tmp/etas-github-rest-path-check/main.es`
  passes for checked `GitHubRestPath` evidence feeding a query/request spec.
- `etas check --no-config /private/tmp/etas-github-rest-path-check/raw_string_forbidden.es`
  fails with the intended raw-string-to-`GitHubRestPath` `TypeMismatch`.
- `etas check --no-config packages/edk-github/src` is now blocked by current
  frontend support for generic effect actions and source-bodied generic tool
  wrappers, applied nominal record
  constructors, representation-backed `GitHubRepoRef` / `BranchRef` /
  `GitHubRestPath` / `ReviewPath` / `PullRequestRef<R, H, B>` /
  `ReviewComment<P>`
  constructor/accessor facts, parameterized
  record field access, and spec-bound dispatch. The GitHub source is intentionally written to the SPEC target with
  `IssueRef<R>`, `PullRequestRef<R, H, B>`, `GitHubQuery<P>`,
  `ReviewComment<P>`, `GitHubResult<R>`, `RestRequestSpec<P>`, and REST paths
  produced through `rest_path(...)` rather than a separate empty-path fallback
  constructor.
- `etas check --no-config /private/tmp/etas-http-public-url-check/main.es`
  passes for checked `PublicHttpUrl` evidence feeding a request builder.
- `etas check --no-config /private/tmp/etas-http-public-url-check/raw_url_forbidden.es`
  fails with the intended raw-`HttpUrl`-to-`PublicHttpUrl` `TypeMismatch`.
- `etas check --no-config /private/tmp/etas-email-header-check/minimal_positive.es`
  passes for checked `EmailHeaderName` / `EmailHeaderValue` evidence feeding an
  evidence-only header constructor.
- `etas check --no-config /private/tmp/etas-email-header-check/minimal_raw_string_forbidden.es`
  fails with the intended raw-string-to-email-header-evidence `TypeMismatch`.
- `etas check --no-config /private/tmp/etas-browser-selector-check/minimal_checked_selector_positive.es`
  passes for checked `Selector` construction without an invalid fallback value.
- `etas check --no-config /private/tmp/etas-browser-selector-check/minimal_raw_selector_forbidden.es`
  fails with the intended raw-string-to-`ParsedSelector` `TypeMismatch`.
- `etas check --all packages/edk-algorithm` and `etas run
  packages/edk-algorithm` pass. The `array[index].field` regression cases remain
  in the algorithm package source and no EDK workaround was introduced.
- `etas check --all packages/edk-workspace` and `etas run
  packages/edk-workspace` pass after `WorkspacePath<R>` was kept nominal and
  changed to a record-backed evidence value with `path_value(...)` as the
  explicit accessor.
- `etas check --all packages/edk-vector` and `etas run packages/edk-vector`
  pass after materializing the `edk_http` dependency and making chunk length
  fields `usize`, removing the previous `usize -> i32 -> 0` fallback path.
- `etas check --all packages/edk-email` and `etas run packages/edk-email`
  pass after email address/account/provider/header/SMTP evidence constructors
  and accessors were made explicit nominal record operations.
- `etas check --all packages/edk-web` and `etas run packages/edk-web` pass
  after checked HTTP URL constructors are matched as
  `Result<PublicHttpUrl, HttpError>` and raw `Url` is used only where the pure
  canonical helper intentionally operates on a raw URL value.

Current blockers:

- `etas check --all packages/edk-db` is blocked on the same transparent record
  constructor/field fact issue for rows, SQL classifications, result records,
  and datasource/query helper shapes, plus runtime-payload policy metadata for
  `EdkDb.query` / `EdkDb.exec`.
- `etas pkg update packages/edk-browser`, `packages/edk-email`,
  `packages/edk-web`, and `packages/edk-vector` now generate `etas.lock` and
  `.etas/package-index.json`.
- `etas pkg update packages/edk-docs`, `packages/edk-eval`,
  `packages/edk-git`, `packages/edk-github`, and `packages/edk-pdf` are blocked
  through the `edk_workspace` dependency metadata path: package metadata cannot
  yet emit the applied nominal schema for `WorkspacePath<WorkspaceRoot>`.
- `etas check --all packages/edk-browser` passes after browser URL/selector
  accessors, generic `ScreenshotRequest<S>` construction, and
  `EdkBrowser.navigate/click/read` public rows were aligned. `etas run
  packages/edk-browser` still fails closed with
  `analysis::MissingHostHandler` for `Network` because no real browser/CDP
  host service is published.
- `etas check --all packages/edk-http` passes for the target nominal method,
  URL, header evidence, and `EdkHttp.request` action family;
  method/host stay in the runtime action payload. The action declaration is
  also `action request(request: HttpActionRequest) -> HttpActionResponse`,
  so source rows and package action declaration use the same static family
  without leaking `HttpRequest` evidence records into action metadata.
- `etas run packages/edk-http` passes with `run value:
  {"kind":"int","value":0}` after moving HTTP evidence values to runnable
  nominal record constructors, removing `std.option.unwrap` from package-local
  Result paths, and making body length/body limit APIs use `usize`.
- `etas run packages/<pkg>` for remaining unverified EDK packages still fails
  at each package's current check/runtime/package metadata boundary; no run
  result should be treated as evidence that a mock/no-op/private host fallback
  exists.
- `etas run tests/fixtures/negative/edk_http_empty_handler_forbidden` and the
  matching std-requirements fixture fail closed with
  `analysis::UnhandledEffectAction`; `etas check` still accepts the empty
  handler shape, so static empty-handler rejection is a frontend/handler checker
  gap.
- `etas check tests/fixtures/negative/runtime_action_scope_value_forbidden`
  and `etas check tests/fixtures/negative/custom_action_scope_gap` now fail
  with `type::InvalidEffectArgument` because
  `perform EdkProbe.request<request.host>(...)` supplies a runtime value where
  the action descriptor has zero static selectors. This is the expected
  fail-closed behavior.
- `bash std-requirements/http/verify.sh` passes end to end. It covers the
  `edk-http` package check, package runtime smoke, preflight/error contract
  runs, source assertions, effects assertions, external path-dependency effect
  facts, negative API-surface checks, empty-handler runtime fail-closed behavior,
  and direct unhandled `EdkHttp.request` runtime failure. The explicit loopback
  success path remains optional behind `ETAS_HTTP_RUN_LOOPBACK=1`.
- `etas pkg update packages/edk-browser` now generates lock/package index, but
  browser runtime remains blocked on a real host service for production opaque
  `BrowserSessionRef` creation. EDK must not fill that gap with a no-op or mock
  production handler.
- `etas pkg update packages/edk-email` now generates lock/package index, and
  package-mode check/run pass for the current source surface.
- `etas check --no-config packages/edk-github/src` is blocked after the GitHub
  evidence refactor on generic effect actions, source-bodied generic tool
  wrappers, applied nominal constructors, parameterized record access, and
  `GitHubPullRequestTarget<R>` spec-bound dispatch.
- `etas check --no-config packages/edk-git/src` is blocked after the Git
  evidence refactor on representation-backed nominal constructor/accessor facts
  for `GitRepoRef`, `BranchRef`, `RemoteRef`, and `GitStatusEntry`, and on
  preserving the transparent `CommitReceipt = GitWriteReceipt` alias when
  `EdkGit.write` returns `GitWriteReceipt`.
- `etas pkg lock packages/edk-github` is blocked through the
  `edk_git`/`edk_workspace` dependency metadata path, and token refs now require
  source-level `SecretKey<GitHubToken>` evidence.

The older package-mode verification notes below are historical until they are
re-run after those compiler/package-manager gaps close.

## Package-Mode Verified

The following package smoke paths currently check and run in package mode:

- `edk-algorithm`;
- `edk-workspace`;
- `edk-http`;
- `edk-email`;
- `edk-vector`;
- `edk-web`.

This package-mode status means the package source and package entry smoke flows
verify through the package manager. It does not make every action-backed public
wrapper fully executable without a real runtime handler/substrate.

## Source Implemented, Package-Mode Blocked

`edk-browser` is source-implemented and package-check verified, but package
runtime remains blocked on a real browser/Network host service for production
opaque handle creation. `edk-db`, `edk-docs`, `edk-eval`, `edk-git`,
`edk-github`, and `edk-pdf` are source-implemented to the target API shape but
package-mode blocked on frontend/package support for transparent record alias
metadata, nominal evidence, parameterized spec evidence constraints,
source-level secret evidence, scoped action metadata, opaque handle producer
metadata, or dependency metadata materialization.
Dependent EDK packages and fixtures must be treated as blocked until those
package metadata artifacts can be produced without weakening the source APIs.

## Remaining Verification Work

All listed EDK packages now have source. Package-mode fixture verification
remains blocked for
`tests/fixtures/positive/edk_workspace_pure_surface`,
`tests/fixtures/positive/edk_db_pure_surface`,
`tests/fixtures/positive/edk_http_pure_surface`,
`tests/fixtures/positive/edk_github_pure_surface`,
`tests/fixtures/positive/edk_browser_pure_surface`,
`tests/fixtures/positive/edk_email_pure_surface`,
`tests/fixtures/positive/edk_docs_pure_surface`,
`tests/fixtures/positive/edk_eval_pure_surface`,
`tests/fixtures/positive/edk_cross_package_matrix`, and
`tests/fixtures/positive/edk_tool_mock_surface`.

`tests/fixtures/positive/edk_algorithm_smoke` now locks, checks, and runs in
package mode; it returns `0` for deterministic graph/search/sort/ranking,
matching, diff, scheduling, and helper coverage.

`tests/fixtures/positive/edk_workspace_pure_surface` source has been updated for
checked `WorkspacePath` construction. The package smoke now checks and runs:
`WorkspacePath<R>` remains nominal, uses a record-backed `{ value: string }`
representation, and `path_value(...)` is the explicit accessor. The workspace
package smoke no longer unwraps failed `workspace_path(...)` results by reusing
the `WorkspaceError.path` payload as evidence; required path construction raises
`WorkspaceError`.
`tests/fixtures/negative/edk_workspace_raw_report_path_constructor_forbidden`
records that external callers must not forge `WorkspacePath<ReportsRoot>`
evidence directly; `report_path(...)` is the checked constructor boundary for
report-write APIs.

`tests/fixtures/positive/edk_db_pure_surface` now locks and checks in package
mode. Package-mode run remains blocked by imported `tool` aliases not being
runtime values.

`tests/fixtures/positive/edk_http_pure_surface` is source-updated for the
nominal method/URL/header target surface: checked `HttpMethod` evidence is
produced by `http_method(...)` or fixed constructors such as `get_method()` /
`post_method()`, public URL constructors return `PublicHttpUrl` evidence,
request builders consume `HttpMethod` plus `PublicHttpUrl`, and `with_header`
consumes `UserHeaderName` / `HeaderValue`. The old public raw
`edk.http.headers.normalize.header` helper has been removed so callers cannot
bypass managed-header checks through a EDK convenience function. Package-mode
verification is no longer blocked by `edk-http` package metadata; these
nominal method/URL/header fixtures need rerun against their own intended
diagnostics.
`tests/fixtures/negative/edk_http_header_name_not_user_settable` additionally
records that ordinary `HeaderName` evidence does not satisfy
`UserSettableHeader`; only checked `UserHeaderName` evidence is valid at the
user-settable header boundary.
`tests/fixtures/negative/edk_http_raw_header_record_forbidden` records that
request `Header` evidence cannot be forged directly from raw
`HeaderSpec<UserHeaderName>`; the source-level request header surface now
carries `HeaderSpec<UserHeaderName>` / `HeaderEvidence<UserHeaderName>`, while
response headers use separate wire evidence.
`tests/fixtures/negative/edk_http_raw_user_header_name_constructor_forbidden`
and `tests/fixtures/negative/edk_http_raw_header_value_constructor_forbidden`
record the narrower constructor-visibility boundary: external callers must not
forge `UserHeaderName` or `HeaderValue` evidence and then pass it through the
public `header(...)` helper.
`tests/fixtures/negative/edk_http_raw_public_url_constructor_forbidden`
records the required constructor-visibility boundary: external callers must not
be able to forge `PublicHttpUrl` evidence from a raw `Url`, because checked URL
constructors enforce public-network host policy before producing that evidence.
`tests/fixtures/negative/edk_http_raw_method_string_forbidden` records that raw
strings must not satisfy `HttpMethod` request-builder parameters.
`tests/fixtures/negative/edk_http_raw_method_constructor_forbidden` records the
constructor-visibility boundary for `HttpMethod`: external callers must not be
able to forge unsupported method evidence with `HttpMethod("TRACE")`. Current
`etas pkg lock` attempts for both method fixtures should now proceed past the
previous `edk-http` metadata blocker and need rerun for their intended
diagnostics. The HTTP package smoke and pure surface fixture no longer use
empty-header/default-request fallbacks in
`must_*` helpers; checked header/request construction failure now raises
`HttpError`.

`tests/fixtures/positive/edk_git_pure_surface` is source-updated for checked
Git repository, branch, remote, and status-entry evidence. Public constructors
return `Result<...>`, invalid strings remain `Err`, and mock helpers no longer
assume unchecked branch/status-entry constructors. Package-mode verification is
currently blocked because `edk-git` source checking needs nominal
constructor/accessor facts for `GitRepoRef(GitRepoSpec)`,
`BranchRef(BranchSpec)`, `RemoteRef(RemoteSpec)`, and
`GitStatusEntry(GitStatusEntrySpec)`, plus transparent `CommitReceipt =
GitWriteReceipt` action-return aliasing.

`tests/fixtures/positive/edk_github_pure_surface` is source-updated for
deterministic repository, raw `GitHubRepoSpec` separated from checked
`GitHubRepoRef` evidence, raw `GitHubRestPathSpec` / `ReviewPathSpec`
separated from checked path evidence, checked `BranchRef` / `GitHubRestPath` /
`ReviewPath` construction, raw `BranchSpec` separated from checked `BranchRef` evidence,
raw `PullRequestSpec<R, H, B>` separated from checked PR evidence,
raw `ReviewCommentSpec<P>` separated from checked review-comment evidence,
generic evidence-carrying `PullRequestRef<R, H, B>`,
`GitHubQuery<P>`, `ReviewComment<P>`, `RestRequestSpec<P>`, REST planning,
webhook header-shape, issue/PR validation, and mock helper coverage.
`GitHubRestPath` no longer has a public `empty_rest_path()` fallback
constructor; even PR-query empty paths go through `rest_path("")`. The fixture
also asserts that valid-shaped `token_ref` / `default_token_ref` calls fail
closed until `SecretKey<GitHubToken>` binding metadata exists, while malformed
token key/account strings are rejected as invalid input. `create_issue` now
checks `is_valid_issue_draft` before requesting `EdkGitHub.issue_create`, so
invalid draft data fails closed at the EDK action boundary; replay/idempotency
metadata remains a separate blocked package-metadata concern. `comment_pr` now
consumes checked `ReviewComment<P>` evidence before requesting
`EdkGitHub.pr_comment`; `edk_github_comment_pr_raw_body_forbidden` records that
a raw comment body must not satisfy that action boundary.
Package-mode verification for `edk-github` is currently blocked during
dependency materialization through `edk_git` / `edk_workspace`; package metadata
cannot yet emit the applied nominal `WorkspacePath<WorkspaceRoot>` dependency
schema. Remaining source blockers include source-level `SecretKey<GitHubToken>`
evidence rather than string construction and frontend source checking for the
applied nominal constructor/action-generic/spec-bound shape used by the target
source, including `BranchRef` constructor/accessor facts after `BranchSpec` was
split from branch evidence.
`tests/fixtures/negative/edk_github_raw_repo_constructor_forbidden` records the
required constructor-visibility boundary: external callers must not be able to
forge `GitHubRepoRef` evidence from raw `GitHubRepoSpec`.
`tests/fixtures/negative/edk_github_raw_repo_spec_not_target` records that raw
`GitHubRepoSpec` records must not satisfy `GitHubTarget`; only checked
`GitHubRepoRef` evidence should carry that spec.
The REST/review path negative fixtures record the same boundary for raw
`GitHubRestPathSpec` / `ReviewPathSpec` values versus checked
`GitHubRestPath` / `ReviewPath` evidence.
The PR negative fixtures record the same boundary for raw
`PullRequestSpec<R, H, B>` values versus checked `PullRequestRef<R, H, B>`
evidence.
The review-comment negative fixture records the same boundary for raw
`ReviewCommentSpec<P>` values versus checked `ReviewComment<P>` evidence.

`tests/fixtures/positive/edk_browser_pure_surface` is source-updated for the
opaque production `BrowserSessionRef` target surface, separate mock-only
`MockBrowserSessionRef`, checked URL construction with `UrlSpec` separated from
`Url` evidence, checked selector construction with `SelectorSpec` separated
from parsed `Selector` evidence, and spec-constrained browser page flows and
tool wrappers. `etas pkg update packages/edk-browser` now generates lock and
package index, and `etas check --all packages/edk-browser` passes. `etas run
packages/edk-browser` still fails closed with `analysis::MissingHostHandler`
for `Network`; opaque production handle producer actions need a real
browser/CDP host service rather than a mock/no-op handler.
`tests/fixtures/negative/edk_browser_raw_url_constructor_forbidden` records
that external callers must not forge browser `Url` evidence directly from
`UrlSpec`; `url(...)` / `https(...)` are the checked constructor boundary.

`packages/edk-email` and `tests/fixtures/positive/edk_email_pure_surface` are
source-updated for raw `EmailAddressSpec` separated from checked
`EmailAddress` evidence, raw `EmailAccountSpec` separated from checked
`EmailAccount` evidence, raw `ProviderEndpointSpec` separated from checked
`ProviderEndpoint` evidence, raw `EmailHeaderSpec<N>` separated from checked
`EmailHeader<N ~ UserSettableEmailHeader>` / `UserEmailHeader` header evidence,
managed-header rejection, `TlsSmtpEndpoint` evidence for TLS-required SMTP
endpoints, `EmailDraft<A ~ DeliverableAddress>` recipient
capability preservation across to/cc/bcc helpers, deterministic draft, MIME,
mailbox, SMTP/provider endpoint, generic tool wrappers, and mock receipt
coverage. `send` now checks account and whole-draft validity before requesting
`EdkEmail.send`, and `read` checks account and mailbox-query validity before
requesting `EdkEmail.read`; invalid data fails closed at the EDK action
boundary. `etas pkg update packages/edk-email` now generates lock and package
index, and `etas check --all packages/edk-email` plus
`etas run packages/edk-email` pass for this source surface.
`tests/fixtures/negative/edk_email_raw_address_constructor_forbidden` records
the required constructor-visibility boundary: external callers must not be able
to forge `EmailAddress` evidence from raw `EmailAddressSpec`.
The account negative fixtures record the same boundary for raw
`EmailAccountSpec` values versus checked `EmailAccount` evidence. Current
`etas pkg lock` attempts for
`tests/fixtures/negative/edk_email_raw_account_spec_not_target` and
`tests/fixtures/negative/edk_email_raw_account_constructor_forbidden` should
now proceed past the previous `edk_http` package-metadata blocker; remaining
diagnostics belong to `edk_email` itself.
`tests/fixtures/negative/edk_email_raw_header_constructor_forbidden` records the
same boundary for raw `EmailHeaderSpec<N>` values versus checked
`EmailHeader<N>` evidence.
`tests/fixtures/negative/edk_email_raw_header_name_constructor_forbidden` and
`tests/fixtures/negative/edk_email_raw_header_value_constructor_forbidden`
record the narrower constructor-visibility boundary for `EmailHeaderName` and
`EmailHeaderValue` evidence before the public `header(...)` helper is called.
The SMTP negative fixtures record the same boundary for raw `SmtpEndpoint`
values versus checked `TlsSmtpEndpoint` evidence.
The provider negative fixtures record the same boundary for raw
`ProviderEndpointSpec` values versus checked `ProviderEndpoint` evidence.
Current `etas pkg lock` attempts for
`tests/fixtures/negative/edk_email_raw_provider_endpoint_spec_not_target` and
`tests/fixtures/negative/edk_email_raw_provider_endpoint_constructor_forbidden`
should now proceed past the previous `edk_http` package-metadata failure.

`tests/fixtures/positive/edk_pdf_pure_surface`, `packages/edk-docs`, and
`packages/edk-eval` are currently blocked before package-mode check/run because
their dependency path reaches `edk-workspace`, whose applied nominal
`WorkspacePath<WorkspaceRoot>` metadata still has no published package metadata
schema.

`tests/fixtures/positive/edk_contract_boundaries` currently locks and checks in
package mode, but package-mode `etas run .` is still blocked because imported
dependency flows are not exposed as runtime values. Its deterministic pure
logic was verified with a temporary source-copy graph, which is not a package
manager substitute.

`tests/fixtures/positive/edk_tool_mock_surface` now locks and checks in package
mode. Package-mode run remains blocked because imported pure `tool` aliases are
not exposed as runtime values.

## Runtime Status

Fully executable before the nominal-safety transition, pending re-verification:

- deterministic pure/source smoke paths that do not request EDK-owned actions,
  including package smoke flows and pure fixtures for algorithms, HTTP
  validation, configured client default application, and shared HTTP preflight
  rejection, workspace path/glob validation, DB SQL classification, Git diff,
  patch, repository, remote, status, and commit-message validation, GitHub shape
  validation, and the combined contract-boundary fixture when verified from a
  temporary source graph;
- deterministic `mocks/` helpers that construct fixture data only.

Runtime blocked:

- action-backed wrappers such as `EdkWorkspace.read/write/list`,
  `EdkDb.query/exec`, `EdkGitHub.*`, and flows that include `Secret.read` in
  their public rows;
- broader `edk-http` response success outside explicitly authorized runtime.
  Package-local smoke keeps pure/default/preflight-helper checks executable,
  the loopback runtime contract is present without mock fallback, and explicit
  `--allow-effects --allow-net 127.0.0.1:<port>` returns `0`. Running the same
  flow without `--allow-net` fails closed with `TCP host adapter is not
  configured`;
- default handler layouts for browser, filesystem, database, vector, document,
  PDF, eval, email, and GitHub operations;
- runtime guard paths that must raise package-defined typed errors before
  requesting an action, including workspace path escapes and DB readonly-query
  rejection. EDK HTTP now covers the public unsupported-method preflight path
  package-locally before transport.

## Golden Effect Status

Golden effect files are interim compiler observations and source-contract
records. Package-owned effects/actions are intentionally present, but runtime
values such as HTTP method/host, workspace paths, and repository strings are no
longer action type arguments. EDK source uses action families such as
`EdkHttp.request`, region evidence such as `EdkWorkspace.read<R>`, and repo
evidence such as `EdkGitHub.issue_create<R>`. Exact method/host/path/repo
checks belong to runtime action payload policy and trace metadata. Exported
reusable allow templates and payload-aware replay remain blocked on package
metadata and interpreter policy support. EDK must not restore runtime values in
`<...>` just to make old summaries pass.

## Default Handler Layout Status

The architecture lists `handlers/default.es` and package-specific alternate
handlers, but default handlers must be real Etas implementations over public
lower-level EDK APIs or public `std` substrate. `edk-http` now has a source
transport handler applied by public APIs and delegated to `edk.http.transport`,
which is checked through TCP/TLS/Stream substrate. The source path applies
timeout/body-limit/retry/redirect defaults, rejects body-limit overflow in
shared preflight, maps TCP/TLS/stream/codec errors to `HttpError` through
tested pure constructors, maps response-body read failures to
`response_body_read`, maps `LimitExceeded` to `response_body_limit`, and decodes
response body bytes through the public std text codec. Remaining HTTP runtime
success outside explicitly authorized loopback requires configured host
authorization; no-allow-net runs fail closed rather than using a EDK fallback.
Negative fixtures keep high-level private HTTP clients, empty handlers, and
unhandled direct `EdkHttp.request` calls from becoming fallback behavior; the
std-requirements version now checks the real `edk_http` package and expects
`analysis::UnhandledEffectAction` at runtime.
Other network, browser, filesystem, database, vector, document, PDF, and eval
handler layout files remain blocked rather than being filled with fake responses
or package-private host bindings.

See `tests/blocked/edk-default-handlers-substrate.txt`.

## Higher-Order Callback Status

The architecture includes higher-order APIs whose public effect rows must
preserve latent effects from callback values, including `edk-algorithm`
callback-based traversal/ranking/sorting/search APIs and `edk-db`
`transaction(ds, body)`. Current Etas source, HIR, package metadata, and
effect summaries cannot express that contract yet.

These APIs are blocked, not partially implemented. EDK must not publish pure
callback assumptions, opaque host callback actions, begin/commit/rollback
execution wrappers, or narrower concrete flows as substitutes for the
architecture's higher-order API names. Concrete pure helpers that already exist
remain valid only as separately useful APIs; they do not close or downgrade the
higher-order callback requirement.

See `tests/blocked/callback-latent-effects.txt` and
`tests/blocked/edk-frontend-tooling-gaps.txt`.

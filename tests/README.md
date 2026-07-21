# EDK Tests

EDK tests should eventually include:

- `golden-effects/`
- `golden-traces/`
- `diagnostics/`
- `interpreter-smoke/`

These directories are placeholders only. They should not contain fake passing
fixtures. Every fixture should correspond to a real supported language or
runtime behavior.

Nominal safety transition note: EDK source is currently being moved to the SPEC
target for nominal evidence types, spec evidence constraints, and checked
constructors. Some package-mode pass/run statements below are historical until
`tests/blocked/edk-nominal-public-constructor-gap.txt` is resolved and the
fixtures are re-verified. Do not downgrade EDK APIs to recover those older green
checks.

Spec syntax migration fixtures:

- `tests/fixtures/negative/old_trait_keyword_forbidden` keeps the removed
  `trait` keyword as a negative parser/frontend fixture.
- `tests/fixtures/positive/spec_impl_canonical_evidence` covers canonical
  `impl Type ~ Spec` evidence satisfying a `T ~ Spec` bound.
- `tests/fixtures/blocked/spec_impl_compat_equivalence` records that
  compatibility `impl Spec for Type` must normalize to equivalent spec
  evidence for `T ~ Spec` dispatch. Current frontend support is blocked there.

Current fixture policy:

- `tests/fixtures/positive/edk_algorithm_smoke` consumes `edk-algorithm` as a
  normal path dependency and covers graph/search/sort/ranking/matching/diff,
  deterministic topological-sort and scheduling tie-breaking, cycle detection,
  negative weighted-graph rejection status, explicit bounded-search
  `invalid_limit` and `limit_exceeded` statuses, schedule rejection for
  duplicate or missing task IDs, deterministic edge-list matching rematches,
  input-order-independent matching output, minimal integer diff scripts for
  insert/delete shifts, plus the pure helper and deterministic testsupport
  modules. Its assertions use sequential guards rather than long boolean
  conjunctions. Package-mode `pkg update`, `pkg lock`, `check`, and `run`
  return successfully.
- `tests/fixtures/positive/edk_http_pure_surface` covers the pure HTTP method,
  URL, header normalization and CR/LF injection rejection, request method
  checked construction, normalization, supported-method validation, request
  encoding, response
  decoding, status-code classification, JSON content-type, query-preserving URL
  parsing that keeps query strings out of host scope, unsupported URL scheme,
  missing scheme separator, missing host, default port construction,
  invalid direct-port rejection, parser-level invalid host rejection for
  user-info forms, direct host validator rejection for unsafe
  label/path/query/control forms, private/reserved host classification, path/query
  fragment, raw-space, and tab rejection, invalid response status rejection,
  managed header rules for `Host`, `Connection`, and `Content-Length`,
  evidence-only `with_header`, `Content-Type` overwrite behavior, body-limit,
  body-length overflow, redirect, retry, SSRF
  helper checks, request-scope extraction, configured client
  timeout/body-limit/retry/redirect default application, shared preflight
  rejection for scope mismatch, unsupported method, invalid URL/path/port,
  private host, invalid header name/value, body-limit, timeout, redirect, and
  retry policy, pure
  HTTP transport error mapping constructors for codec, TCP, TLS, stream,
  response body reads, and substrate-blocked failures, and
  explicit mock route matching with unmatched errors instead of fake responses.
  Package-mode results are historical during the nominal safety transition:
  `edk-http` now uses nominal method/URL/header evidence and is blocked on
  frontend/package metadata support for that source shape.
- `tests/fixtures/negative/edk_http_header_name_not_user_settable` records the
  header capability boundary directly: ordinary `HeaderName` evidence must not
  satisfy `UserSettableHeader`; only checked `UserHeaderName` evidence is valid
  for user-settable request header construction.
- `tests/fixtures/negative/edk_http_raw_header_record_forbidden` records that
  request `Header` evidence cannot be forged directly from raw
  `HeaderSpec<UserHeaderName>`; callers must use checked header constructors.
- `tests/fixtures/negative/edk_http_raw_user_header_name_constructor_forbidden`
  records that external callers must not forge `UserHeaderName` evidence and
  bypass the checked managed-header gate.
- `tests/fixtures/negative/edk_http_raw_header_value_constructor_forbidden`
  records that external callers must not forge `HeaderValue` evidence and
  bypass CR/LF header-injection checks.
- `tests/fixtures/negative/edk_http_raw_public_url_constructor_forbidden`
  records the URL evidence boundary directly: external callers must not forge
  `PublicHttpUrl` with a raw `Url` constructor, because public network targets
  must be produced by checked URL constructors.
- `tests/fixtures/negative/edk_web_public_http_url_result_not_bare_url`
  records the web URL boundary: checked HTTP URL constructors return
  `Result<PublicHttpUrl, HttpError>` and callers must not pass that result to
  `edk-web` APIs that require a bare `Url` without explicit error handling and
  unwrapping.
- `tests/fixtures/negative/edk_http_raw_method_string_forbidden` records that
  raw strings must not be accepted where checked `HttpMethod` evidence is
  required.
- `tests/fixtures/negative/edk_http_raw_method_constructor_forbidden` records
  that external callers must not forge `HttpMethod` evidence with a raw nominal
  constructor.
- `tests/fixtures/negative/edk_email_raw_address_constructor_forbidden` records
  that `EmailAddress` evidence must not be forgeable from external raw
  `EmailAddressSpec`; callers must go through checked `parse_address(...)` /
  `email_address(...)`.
- `tests/fixtures/negative/edk_email_raw_account_spec_not_target` records that
  raw `EmailAccountSpec` records do not satisfy `EmailAccountTarget`.
- `tests/fixtures/negative/edk_email_raw_account_constructor_forbidden` records
  that external callers must not forge `EmailAccount` evidence from raw account
  specs; callers must go through checked `email_account(...)`.
- `tests/fixtures/negative/edk_email_raw_header_constructor_forbidden` records
  that external callers must not forge `EmailHeader<...>` evidence from raw
  email header specs.
- `tests/fixtures/negative/edk_email_raw_header_name_constructor_forbidden`
  records that external callers must not forge `EmailHeaderName` evidence and
  bypass managed-header checks.
- `tests/fixtures/negative/edk_email_raw_header_value_constructor_forbidden`
  records that external callers must not forge `EmailHeaderValue` evidence and
  bypass CR/LF header-injection checks.
- `tests/fixtures/negative/edk_email_raw_smtp_endpoint_not_tls_required`
  records that raw `SmtpEndpoint` records do not satisfy `TlsRequiredEndpoint`;
  checked `TlsSmtpEndpoint` evidence is required.
- `tests/fixtures/negative/edk_email_raw_tls_smtp_endpoint_constructor_forbidden`
  records that external callers must not forge `TlsSmtpEndpoint` evidence from
  a raw SMTP record.
- `tests/fixtures/negative/edk_email_raw_provider_endpoint_spec_not_target`
  records that raw `ProviderEndpointSpec` records do not satisfy
  `EmailProviderEndpointTarget`.
- `tests/fixtures/negative/edk_email_raw_provider_endpoint_constructor_forbidden`
  records that external callers must not forge `ProviderEndpoint` evidence from
  raw provider endpoint specs.
- `tests/fixtures/negative/edk_browser_raw_selector_spec_not_parsed` records
  that raw `SelectorSpec` records do not satisfy `ParsedSelector`.
- `tests/fixtures/negative/edk_browser_raw_selector_constructor_forbidden`
  records that external callers must not forge parsed `Selector` evidence from
  a raw selector spec.
- `tests/fixtures/negative/edk_browser_raw_url_constructor_forbidden` records
  that external callers must not forge checked browser `Url` evidence from raw
  `UrlSpec`; callers must use `url(...)` / `https(...)`.
- `tests/fixtures/negative/edk_github_raw_repo_constructor_forbidden` records
  that `GitHubRepoRef` evidence must not be forgeable from an external raw
  `GitHubRepoSpec`; callers must go through checked `github_repo(...)` /
  `github_enterprise_repo(...)`.
- `tests/fixtures/negative/edk_github_raw_repo_spec_not_target` records that
  raw `GitHubRepoSpec` records do not satisfy `GitHubTarget`.
- `tests/fixtures/negative/edk_github_raw_branch_spec_not_branch_ref` records
  that raw `BranchSpec` records do not satisfy `GitHubBranchRef`.
- `tests/fixtures/negative/edk_github_raw_branch_constructor_forbidden` records
  that external callers must not forge `BranchRef` evidence from raw branch
  specs.
- `tests/fixtures/negative/edk_github_raw_pull_request_spec_not_target` records
  that raw `PullRequestSpec<...>` records do not satisfy
  `GitHubPullRequestTarget<...>`.
- `tests/fixtures/negative/edk_github_raw_pull_request_constructor_forbidden`
  records that external callers must not forge `PullRequestRef<...>` evidence
  from raw PR specs.
- `tests/fixtures/negative/edk_github_raw_rest_path_spec_not_route` records
  that raw `GitHubRestPathSpec` records do not satisfy `GitHubRestRoute`.
- `tests/fixtures/negative/edk_github_raw_rest_path_constructor_forbidden`
  records that external callers must not forge `GitHubRestPath` evidence from
  raw REST path specs.
- `tests/fixtures/negative/edk_github_raw_review_path_spec_not_review_path`
  records that raw `ReviewPathSpec` records do not satisfy
  `GitHubReviewPath`.
- `tests/fixtures/negative/edk_github_raw_review_path_constructor_forbidden`
  records that external callers must not forge `ReviewPath` evidence from raw
  review path specs.
- `tests/fixtures/negative/edk_github_raw_review_comment_constructor_forbidden`
  records that external callers must not forge `ReviewComment<...>` evidence
  from raw review comment specs.
- `tests/fixtures/negative/edk_github_comment_pr_raw_body_forbidden` records
  that `comment_pr(...)` consumes checked `ReviewComment<...>` evidence rather
  than accepting a raw comment body at the action boundary.
- `tests/fixtures/negative/edk_workspace_raw_report_path_constructor_forbidden`
  records that external callers must not forge `WorkspacePath<ReportsRoot>`
  evidence directly; callers must use checked `report_path(...)`.
- `packages/edk-http/src/edk/http/package_api_contract.es` is checked with the
  package and records package-local type/effect coverage for
  `edk.http.request/get/post/put/patch/delete/head`; the same effect footprint
  is summarized in `tests/golden-effects/edk-http-request.txt`.
- `tests/fixtures/positive/edk_workspace_pure_surface` covers pure workspace
  path escape rejection for absolute, parent-segment, backslash, and
  drive-style path forms plus CR/LF/tab control characters, child path joining,
  `.`/duplicate-slash normalization, segment-aware glob/scope matching with
  single-segment `*`, recursive `**`, negative nested-path and prefix-collision
  cases, conservative non-matching for unsupported multi-wildcard path segments,
  escaped scope/glob control-character rejection, snapshot, write-option, and
  deterministic filesystem mock constructors. Package-mode `pkg update`, `pkg
  lock`, `check`, and `run` return successfully.
- `tests/fixtures/positive/edk_db_pure_surface` covers pure DB SQL
  classification including mixed readonly/mutation statements, high-impact
  mutation keywords, conservative admin/session mutation keywords such as
  vacuum/analyze/pragma/set/use/lock/refresh, semicolon-delimited statement
  boundaries, CR/LF/tab whitespace normalization, comment-adjacent and leading
  block-comment keyword boundaries, savepoint transaction statements, pure
  `explain_query` tool delegation, named placeholder validation for `:name` and
  `@name` parameters, row lookup, deterministic result constructors, pool
  options, and transaction option records. Package-mode `pkg update`, `pkg
  lock`, and `check` return successfully; package-mode `run` remains blocked
  because imported `tool` aliases are not exposed as runtime values.
- `tests/fixtures/positive/edk_contract_boundaries` groups the current EDK
  safety-boundary regressions: DB readonly classification rejects mutation,
  mixed, transaction, and unknown SQL before `query_readonly` can be
  republished; workspace pure helpers recognize absolute, parent-segment,
  backslash, drive-style, and control-character path escapes; HTTP pure helpers
  keep `TRACE` unsupported; and GitHub data constructors stay valid without
  executing token reads. This is source/pure coverage only, not runtime
  acceptance for action-backed wrappers; visible GitHub `Secret.read` contract
  coverage remains in `tests/golden-effects/edk-github-actions.txt`.
  Its `.es` files parse and package-mode lock/check succeeds; package-mode
  run remains blocked because imported dependency flows are not runtime values.
- `tests/fixtures/positive/edk_http_pure_surface` and
  `packages/edk-http/src/edk/http/package_smoke.es` cover explicit
  `host:port` URL authority: default ports are preserved, custom explicit
  ports parse, invalid port text/ranges are rejected, URL injection literals
  with backslash, CR/LF, unsafe host labels, and fragments are rejected, and EDK
  keeps the source-level `Url.port` model instead of dropping explicit authority. Public
  `edk.http.request` runtime replay through the source transport handler is
  tracked as blocked once bottom `Tcp/Stream/Tls` action facts are preserved.
- `tests/fixtures/positive/edk_vector_pure_surface` covers pure vector
  similarity, malformed embedding rejection, chunking policy validation, line
  chunking, line-only policy aggregation with overlap-policy rejection, filter
  matching including value-only filter rejection,
  store/model/record/query shape validation including unsafe store identity
  rejection for `/`, backslash, colon, and newline path tokens, record/query
  compatibility, query construction, and deterministic mock result/write receipt
  constructors. Package-mode `pkg update`, `pkg lock`, `check`, and `run`
  return successfully.
- `tests/fixtures/positive/edk_web_pure_surface` covers pure web
  canonicalization, HTML/media-type detection, robots decisions with prefix
  rules, case-insensitive directives, comments, empty rule handling,
  more-specific allow/deny precedence, and same-domain versus same-origin
  separation across schemes, crawl/trust constructors with crawl limit and
  robots-obedience validation, fetch option validation, case-insensitive unsafe
  marker detection, HTTP response-to-page conversion, deterministic mock search
  filtering with empty-query/provider/language rejection, over-limit rejection,
  and deterministic mock fetch/crawl page constructors.
  Package-mode `pkg update`, `pkg lock`, `check`, and `run` return
  successfully.
- `tests/fixtures/positive/edk_email_pure_surface` covers pure email address
  parsing including CR/LF/tab rejection, missing domain dots, empty local/domain
  dot segments, checked account/provider/mailbox token validation,
  draft/header/MIME helpers with raw `EmailAddressSpec` separated from checked
  `EmailAddress` evidence, raw `EmailAccountSpec` separated from checked
  `EmailAccount` evidence, raw `ProviderEndpointSpec` separated from checked
  `ProviderEndpoint` evidence, checked `EmailHeader[N:
  UserSettableEmailHeader]` / `UserEmailHeader` evidence separated from raw
  `EmailHeaderSpec<N>`,
  managed-header rejection,
  `EmailDraft<A ~ DeliverableAddress>` recipient capability preservation across
  to/cc/bcc helpers, whole-draft validation before send, unsafe
  header-name/value/subject/idempotency rejection, pure `draft_email` tool
  coverage, endpoint constructors and validation, invalid query empty-page
  behavior, and deterministic mock mailbox page/filter/receipt helpers.
  Package-mode results are historical during the nominal safety transition: the
  source is now intentionally ahead of current frontend/package support for
  imported nominal header constructor/accessor facts, parameterized draft
  metadata, and blocked nominal HTTP dependency metadata.
- `tests/fixtures/positive/edk_browser_pure_surface` covers pure browser
  selector parsing through checked `Result<Selector, SelectorError>`
  constructors with text-prefix normalization and empty selector rejection,
  URL/session/option constructors and validation for unsafe URL hosts, URL
  schemes, raw path spaces/tabs/fragments/backslashes/embedded absolute URLs,
  normalized origins, profiles, and navigation options, DOM summary helpers with
  empty search-text rejection, screenshot request/reference shape validation,
  deterministic mock snapshot constructors, and a separate mock-only browser
  session handle that is not accepted by production page APIs. Package-mode
  results are historical during the nominal safety transition: browser page
  flows now target `BrowserSession` / `ParsedSelector` spec-bound APIs and are
  blocked on frontend/package support for those facts plus blocked HTTP
  dependency metadata.
- `tests/fixtures/positive/edk_git_pure_surface` covers pure Git diff parsing,
  patch path-token validation including absolute path, `..` segment, backslash,
  drive-style/colon path, rename escape, `/dev/null`, and non-escape `..hidden`
  cases, segment-aware repository/status path validation with the same escape
  rules, branch/ref token validation, remote reference name and URL validation
  including tab/control-character, embedded-credential/empty-host/path-escape
  rejection,
  status/commit-message helpers with CR rejection, and deterministic mock read
  result/write receipt constructors. Package-mode `pkg update`, `pkg lock`,
  `check`, and `run` return successfully.
- `tests/fixtures/positive/edk_github_pure_surface` covers pure GitHub
  repository references with conservative repo/path validation for
  absolute paths, `..` segments, backslashes, colon-style path tokens, unsafe
  API hosts, query/fragment host markers, tab/control characters, and unsafe
  idempotency keys, raw `GitHubRepoSpec` separated from checked
  `GitHubRepoRef` evidence, raw `GitHubRestPathSpec` / `ReviewPathSpec`
  separated from checked path evidence, checked `BranchRef`,
  `GitHubRestPath`, and `ReviewPath` construction before PR/query/review
  references, raw `PullRequestSpec<R, H, B>` separated from checked
  `PullRequestRef<R, H, B>`, raw `ReviewCommentSpec<P>` separated from checked
  `ReviewComment<P>`, generic evidence-carrying
  `PullRequestRef<R, H, B>`, `GitHubQuery<P>`, `ReviewComment<P>`,
  `RestRequestSpec<P>`, issue/PR helper validation, REST request planning,
  webhook signature header shape validation, and deterministic mock API
  result/reference constructors. Package-mode verification is currently blocked
  by nominal HTTP/Git/workspace dependency metadata, source-level secret
  evidence, and frontend support for applied nominal constructors, generic
  effect actions, parameterized record access, and spec-bound dispatch.
- `tests/fixtures/positive/edk_pdf_pure_surface` covers pure PDF supported
  header-version and encryption-marker classification, malformed/incomplete
  header rejection, deterministic document/page/span/image/outline constructors
  and validators, unique page-number checks, metadata text control-character
  rejection, outline title control-character rejection, outline page references,
  layout summaries with empty text-search rejection, citation-map keys with
  empty/unsafe prefix rejection, citation key token validation including tab and
  URL-token rejection, citation key uniqueness, citation page references, unsafe
  image identifier/media-type token rejection, and render-option validation with
  unsafe format rejection. Package-mode `pkg update`, `pkg lock`, `check`, and
  `run` return successfully.
- `tests/fixtures/positive/edk_docs_pure_surface` covers pure document format
  constructors and validators with expected media-type matching, unsafe
  format/media token rejection including tab and media-parameter markers,
  PDF-derived text format construction, conversion options, document
  input/output mocks, Markdown AST classification with empty-line skipping,
  heading levels 1 through 6, over-deep heading rejection, no-space
  heading-marker rejection, embedded newline rejection inside block text,
  document model helpers with AST validation and heading-level counts, pure
  `extract_markdown_summary`/`sanitize_html` tool delegation, and conservative
  case-insensitive plain-text-only HTML risk handling with deterministic finding
  counts for raw and entity-encoded markup, active content, unsafe schemes,
  inline handlers, `srcdoc`, `style`, and CSS expression markers. Package-mode
  `pkg update`, `pkg lock`, and `check` return successfully; package-mode
  `run` remains blocked because imported `tool` aliases are not exposed as
  runtime values.
- `tests/fixtures/positive/edk_eval_pure_surface` covers stable assertion and
  text diff diagnostics with newline/carriage-return escaping, strict ordered
  trace matching, non-increasing order rejection, duplicate occurrence checks,
  trace action-name token validation including tab and URL-token rejection,
  suite/case/result token validation with suite root escape rejection for
  absolute paths, `..` segments, backslashes, colon-style path tokens, and tab
  control characters, write receipt path validation, pure
  `compare_golden`/`summarize_eval_result` tool delegation, and deterministic
  eval fixture/result/receipt mock constructors. Package-mode `pkg update`,
  `pkg lock`, and `check` return successfully; package-mode `run` remains
  blocked because imported `tool` aliases are not exposed as runtime values.
- `tests/fixtures/positive/edk_cross_package_matrix` contains source fixtures
  for all seven architected cross-package scenarios, including untrusted-result
  preservation, sanitizer gates, workspace scope/path checks, repo/PR
  validation, vector/PDF/eval validators, visible action rows, and sequential
  guard assertions that avoid the current long-boolean-conjunction frontend
  blocker. Package-mode `pkg update`, `pkg lock`, and `check` return
  successfully; package-mode `run` fails closed without real host services.
- `tests/fixtures/positive/edk_tool_mock_surface` contains source fixtures for
  the architected tool/mock layers added to HTTP, workspace, DB, vector,
  browser, Git, Email, GitHub, Docs, PDF, and Eval, including pure validator
  gates for schemes, headers, SQL classification, selectors, repositories,
  patches, vector filters, workspace scopes, address/repo validation, document
  formats, PDF document shapes, and eval suites. The fixtures keep
  package-owned action rows visible without asserting fake default action
  results, and use sequential guard assertions rather than long boolean
  conjunctions. Package-mode `pkg update`, `pkg lock`, and `check` return
  successfully; package-mode `run` remains blocked because imported pure
  `tool` aliases are not exposed as runtime values.
- `tests/fixtures/negative/std_web_unresolved` proves old std `Web` vocabulary
  is not implicitly available.
- `tests/fixtures/negative/edk_email_raw_recipient_array_forbidden` records that
  raw string arrays must not satisfy `EmailDraft<A ~ DeliverableAddress>`
  recipient evidence.
- `tests/fixtures/negative/removed_std_vocabulary` proves removed std external
  package vocabulary such as `Workspace`, `Db`, `Vector`, `Browser`, `Email`,
  and `Payment` is not implicitly available.
- `tests/fixtures/negative/removed_std_actions` isolates removed actions under
  still-existing core roots so `Agentic.embed`, `Command.spawn`, and
  `Memory.migrate` cannot be masked by earlier unknown-root diagnostics.
- `tests/fixtures/negative/custom_action_scope_gap` captures the missing
  source-level rejection required when code tries to put a runtime field such
  as `request.host` into an action `<...>` static scope.
- `tests/fixtures/negative/runtime_action_scope_value_forbidden` isolates the
  SPEC rule that runtime payload fields cannot be used as action type
  arguments. Current frontend checking incorrectly accepts the fixture once the
  effect row is written as bare `EdkProbe.request`; this is tracked as a
  frontend blocker, not a EDK fallback.
- `tests/blocked/edk-frontend-tooling-gaps.txt` keeps compiler, frontend, CLI,
  and package-manager gaps out of `std-requirements/` while preserving
  unresolved work items for package metadata, scoped custom actions,
  source-file checks, workspace manifests, and contextual-keyword record
  literals.
- `tests/blocked/callback-latent-effects.txt` records higher-order callback
  APIs that must remain pending until callback latent effects can be represented
  by the language, HIR, package metadata, and effect summaries. These APIs are
  blocked, not partially implemented; EDK slices must update that blocker
  instead of adding fallback callback shims, opaque host callback actions, or
  downgraded pure substitutes.
- `tests/blocked/long-boolean-conjunction-stack-overflow.txt` records that
  very long `&&` assertion chains can overflow the current frontend during HIR
  lowering/checking; executable fixtures should use sequential guards until
  this is fixed.
- `tests/blocked/edk-http-default-handler-substrate.txt` records that the
  source transport handler is applied by public APIs, public unsupported-method
  preflight now runs before transport, response body bytes are decoded through
  std text codec, and full HTTP response success is covered for explicit
  loopback `--allow-net` while no-allow-net runs fail closed.
- `tests/blocked/edk-http-typed-json-codec.txt` records that typed JSON HTTP
  helpers remain blocked on JSON error mapping and public package metadata;
  `edk-http` has an internal `std.json` probe but does not expose `post_json`,
  `fetch_json`, or `submit_json` string shortcuts.
- `tests/blocked/edk-http-policy-templates.txt` records that scoped HTTP
  templates such as `HttpReadOnly`, `HttpAllowHosts`, `HttpDenyMutations`,
  `HttpNoPrivateNetwork`, `HttpRequireTimeout`, and `HttpBoundedBody` remain
  blocked until package metadata can export action argument templates and
  request-field policy predicates. Source-local exact HTTP policy coverage
  lives in `std-requirements/http/positive/scoped_policy_allow_get` and
  `std-requirements/http/negative/scoped_policy_deny_post`.
- `tests/blocked/edk-http-mock-dry-run-trace.txt` records that HTTP mock and
  dry-run trace execution is blocked; current mocks are deterministic pure
  route-match helpers, not registered production handlers.
- `tests/fixtures/negative/edk_http_client_convenience_forbidden` proves
  `edk.http.client` no longer exposes method-specific convenience wrappers.
- `tests/fixtures/negative/edk_http_opinionated_api_forbidden` proves
  `edk.http` and `edk.http.api` do not expose `post_json`, and no
  `edk.http.tools.*` JSON/text shortcuts are public API.
- `std-requirements/http/negative/client_request_entry_forbidden` proves
  `edk.http.client.request` is not a second public HTTP execution entry point;
  public request execution stays on `edk.http.request/get/post/put/patch/delete/head`.
- `std-requirements/http/positive/external_root_api_effect_facts` proves
  external path-dependency calls to effectful root `edk.http.get/post` APIs and
  direct `edk.http.api.get/post` imports replay checked effect facts after
  package metadata is materialized.
- `std-requirements/http/negative/unhandled_action_no_handler` is the target
  direct-action fixture for `perform EdkHttp.request(request)` against the real
  package. It must fail at runtime without an explicit handler, but current
  frontend verification is blocked until scoped action parameters are
  materialized from request evidence.
- `std-requirements/http/positive/stream_error_limit_import` and
  `std-requirements/http/positive/stream_error_limit_variant` prove both direct
  import and qualified `StreamError.LimitExceeded` forms are source-visible and
  runtime-matchable. EDK HTTP maps that path to `response_body_limit`.
- `tests/fixtures/negative/edk_http_private_host_client_forbidden` proves a
  high-level `std.http.request` host client is not available; HTTP must go
  through EDK source handlers over the public TCP/TLS/stream/codec substrate.
- `tests/fixtures/negative/edk_http_empty_handler_forbidden` proves
  `handler {}` cannot satisfy `EdkHttp.request` or stand in for an
  implementation.
- `tests/fixtures/negative/edk_http_unhandled_action_no_handler` mirrors that
  direct-action target: `perform EdkHttp.request(request)` remains an explicit
  escape hatch and must not use package metadata fallback, but verification is
  currently blocked on package action metadata and payload-aware policy replay.
- `tests/blocked/edk-workspace-path-escape-runtime-guard.txt` records that
  runtime `read`/`write`/`list` path escape rejection must wait for
  package-defined typed errors and scoped action metadata; empty reads/lists,
  no-op writes, or root-relative substitute paths are rejected as fallback
  behavior.
- `tests/blocked/edk-db-pure-surface-package-mode.txt` records that the DB
  pure-surface fixture now locks and checks, but package-mode run is blocked
  because imported `tool` aliases are not runtime values.
- `tests/blocked/edk-db-query-readonly-runtime-guard.txt` records that
  `query_readonly` is intentionally unpublished until it can reject
  non-readonly SQL before requesting `EdkDb.query` using package-defined
  typed errors and runtime datasource payload metadata.
- `tests/blocked/edk-db-run-migration-policy.txt` records that the architected
  `run_migration` tool must remain pending until high-impact scoped policy
  metadata exists.
- `tests/blocked/edk-contract-boundaries-package-mode.txt` records that the
  combined contract-boundary fixture can lock/check, but package-mode run is
  blocked because dependency imports are not runtime values; GitHub
  `Secret.read` coverage remains a source contract, not a runtime token-read
  test.
- `tests/blocked/edk-email-pure-surface-package-mode.txt` records that the
  email pure-surface fixture now locks and checks, but package-mode run is
  blocked because imported `tool` aliases are not runtime values.
- `tests/blocked/edk-docs-pure-surface-package-mode.txt` records that the docs
  pure-surface fixture now locks and checks, but package-mode run is blocked
  because imported `tool` aliases are not runtime values.
- `tests/blocked/edk-eval-pure-surface-package-mode.txt` records that the eval
  pure-surface fixture now locks and checks, but package-mode run is blocked
  because imported `tool` aliases are not runtime values.
- `tests/blocked/edk-default-handlers-substrate.txt` records that architected
  default handler layout files remain pending until public lower-level
  substrate and handler metadata exist; they must not be replaced by fake
  fallback handlers.
- `tests/golden-effects/edk-http-request.txt` records that HTTP wrappers expose
  `EdkHttp.request` and require host mediation rather than returning fake
  responses.
- `tests/golden-effects/edk-workspace-files.txt` records that workspace
  read/write/list expose `EdkWorkspace.*` and require host mediation rather than
  using host-internal filesystem grants.
- `tests/golden-effects/edk-db-sql.txt` records that database query/exec expose
  `EdkDb.*` and require host mediation rather than using a fake local database.
- `tests/golden-effects/edk-vector-actions.txt` records that vector embed,
  search, write, and retrieve expose package-owned actions rather than removed
  std actions such as `Agentic.embed`. Package-mode verification now succeeds
  for the `edk-vector` package and pure-surface fixture.
- `tests/golden-effects/edk-browser-page.txt` records that browser page actions
  expose `EdkBrowser.*` and require host mediation rather than a fake browser.
  Package-mode lock/check/run now succeeds for the package smoke; production
  browser execution remains blocked on WebDriver/CDP/WebSocket substrate.
- `tests/golden-effects/edk-email-actions.txt`,
  `edk-web-actions.txt`, `edk-github-actions.txt`, `edk-pdf-actions.txt`,
  `edk-docs-actions.txt`, and `edk-eval-actions.txt` record source-contract
  effect baselines for action-backed packages until `etas effects` can replay
  package-owned actions with final scoped metadata.
- `tests/golden-effects/edk-pdf-pure-surface.txt` records the pure PDF fixture
  baseline and explicitly excludes native parsing, rendering, default handlers,
  and placeholder artifacts.
- `tests/golden-effects/edk-docs-pure-surface.txt` records the pure docs
  fixture baseline and explicitly excludes file conversion, byte/text codec
  shortcuts, native DOCX/PDF conversion, and default handlers.
- `tests/golden-effects/edk-eval-pure-surface.txt` records the pure eval
  fixture baseline, including strict trace order diagnostics, and explicitly
  excludes default eval-store handlers, hidden filesystem IO, and fake
  evaluation runners.
- `tests/golden-effects/edk-cross-package-matrix.txt` records the expected
  action coverage for the seven cross-package matrix scenarios. Package-mode
  update/lock/check now succeeds; run fails closed without real host services.
- `tests/golden-effects/edk-tool-mock-surface.txt` records the expected action
  coverage for the tool/mock fixture. Package-mode update/lock/check now
  succeeds; run remains blocked by imported pure `tool` aliases not being
  runtime values.
- `tests/golden-effects/edk-policy-templates.txt` records the deny-only policy
  templates that are source-present today and separates them from scoped
  allow/approval templates that remain blocked.
- `tests/blocked/edk-github-secret-read.txt` records that GitHub token access
  must remain policy-visible through `Secret.read<token>`, not ordinary string
  token parameters or hidden handler reads.
- `tests/blocked/edk-github-webhook-hmac.txt` records that full webhook
  HMAC-SHA256 verification remains pending until secret, byte, and crypto
  substrate can be represented without hiding authority.
- `tests/blocked/edk-github-replay-metadata.txt` records that issue/comment
  write replay metadata remains pending until package-owned action metadata and
  trace replay can represent it; `IssueDraft.idempotency_key` is not treated as
  a complete metadata substitute.
- `tests/blocked/edk-pdf-render-page.txt` records that PDF page rendering is
  pending because the public substrate does not expose PDF graphics, font, or
  image rendering primitives.
- `tests/blocked/edk-docs-convert-file.txt` records that file conversion is
  pending because byte/text codecs and path-scoped action metadata are not
  stable through the EDK source surface.
- `tests/blocked/edk-email-approval-policy.txt` records that approval policy
  templates for `EdkEmail.send` require payload-aware package action
  metadata and must not be replaced by in-flow approval logic.
- `tests/blocked/edk-email-send-replay-metadata.txt` records that
  `EdkEmail.send` replay/idempotency metadata and traces remain blocked by
  package action metadata and package-mode trace replay; the ordinary
  `EmailDraft.idempotency_key` field is not treated as a complete metadata
  substitute.
- `tests/blocked/edk-scoped-policy-templates.txt` records that scoped allow and
  before/after policy templates remain blocked by package-defined action
  argument metadata. Integration packages currently publish only safe deny
  templates under `src/edk/*/policies/`.
- `tests/blocked/source-file-check-package-root.txt` records that direct
  `etas check --no-config <source-file>` still requires the enclosing package
  lockfile, limiting source-file-only verification inside package roots even
  after package metadata is available. During the nominal-safety transition,
  current package-mode status is tracked in `tests/package-status.md`.
- `tests/blocked/cross-package-matrix-package-mode.txt` records that the
  cross-package matrix fixture remains package-mode blocked while dependency
  metadata for nominal safety packages is unavailable.
- `tests/blocked/edk-tool-mock-surface-package-mode.txt` records that the
  tool/mock surface fixture now locks and checks, but package-mode run is
  blocked by imported pure `tool` aliases not being runtime values.
- `tests/blocked/edk-tool-call-runtime-boundary.txt` records that tool-call
  fixtures are source/effect coverage only and must not be promoted to
  interpreter smoke without real runtime semantics.
- `tests/diagnostics/removed-std-vocabulary.txt` records expected diagnostics
  for negative fixtures that prove removed std integration vocabulary and
  removed std actions do not leak back into the effect registry.
- `tests/interpreter-smoke/package-smokes.txt` records historical package-mode
  interpreter smoke gates. During the nominal-safety transition, current
  package-mode status is tracked in `tests/package-status.md`.
- `tests/golden-traces/README.md` records why runtime action traces are still
  pending and must not be replaced with synthetic fallback traces.

Package-mode verification during the nominal-safety transition is tracked in
`tests/package-status.md`; packages depending on nominal safety source are not
marked fully verified here.

Package-mode fixtures still blocked at runtime/tooling boundaries:

- cross-package action matrix fixtures that require real host services;
- fixtures that import pure `tool` aliases before those aliases are callable
  runtime values;
- reusable scoped policy/replay/profile artifacts that require final package
  metadata and trace replay support.

Blocked package-mode checks are recorded under `tests/blocked/`.

# EDK vs SPEC - Remaining Gaps

> Purpose: compare the current EDK implementation against the 17 SPEC documents
> under `etas/docs/design/` and identify design points that EDK has not yet
> implemented or has fallen behind.
>
> This document does not repeat the SPEC. It lists only differences, gaps, and
> areas that appear outdated, grouped by topic.

## 0. Overall Status in One Sentence

EDK already contains 13 packages, more than 200 `.es` source files, and roughly
70 test fixtures. The differences between EDK and the SPEC are not simply
"missing implementations"; they fall into two categories:

1. **The SPEC requires concepts that EDK does not yet express**: trace-spec
   templates, `Approval.request`, `MemoryRegion`/`Store`, durable memory,
   `agent`/`protocol`, `join`/`map_concurrent`, `~ TraceSpec` conformance,
   higher-level EDK APIs such as `search`/`fetch`/`crawl`/`citation`, and example
   repositories.
2. **EDK contains pragmatic tooling compromises beyond the SPEC**: several
   packages use paired `raw+checked` nominal names, `alias` sometimes stands in
   for substantive types, external tests use a temporary source-copy graph,
   `PublicHttpUrl` rejects loopback while runtime execution bypasses it through
   `--allow-net`, and EDK trace-spec templates remain incomplete. The SPEC does
   not explicitly prohibit all of these choices, but they are in tension with
   its principle that a harness should remain analyzable.

> The current index for all language and rule documents is
> `etas/docs/design/01-overview.md`. This document refers to SPEC files by name.

---

## 1. Repository Skeleton and Workspace

### 1.1 Lockfile and edition alignment are incomplete in `etas.toml`

- The root EDK `etas.toml` is a `[workspace]` manifest, but it does not fully
  match the examples in SPEC sections 15 and 10:
  - The SPEC example includes
    `[workspace.dependencies] std = { version = "0.1" }`; EDK does as well.
  - However, SPEC section 15, subsection 13.1 emphasizes that the lockfile is a
    project compilation input. The EDK repository has no root `etas.lock`.
    Individual package directories have their own `etas.lock`, such as
    `edk-http/etas.lock`, but the workspace has no unified lockfile.
  - Package manifests generally include only `[package] name = "edk-..."` and
    omit `[package].repository`. Some packages specify `repository`, but every
    `description` still reads "Official EDK ... package skeleton", which is a
    placeholder compared with the SPEC section 15, subsection 4 fields for
    description, license, and repository.
- Some local EDK dependencies can now be materialized. For example,
  `edk-email`, `edk-web`, and `edk-vector` generate locks and package indexes
  through `edk-http`. However, `edk-docs`, `edk-eval`, `edk-git`, `edk-github`,
  and `edk-pdf` remain blocked on the `edk-workspace` applied-nominal metadata
  path. This remains a package-manager and metadata gap; EDK should not handwrite
  dependency metadata to bypass it.

### 1.2 The workspace contains one package beyond the SPEC: `edk-algorithm`

- SPEC section 17, subsection 5 lists 12 packages: `edk.http`, `edk.web`,
  `edk.workspace`, `edk.email`, `edk.db`, `edk.vector`, `edk.browser`,
  `edk.git`, `edk.github`, `edk.pdf`, `edk.docs`, and `edk.eval`.
- The "First EDK Package Set" table in SPEC section 17, subsection 5 does not
  include `edk-algorithm`. However, both the EDK `etas.toml` and `packages/`
  include it, and `docs/architect/edk-architecture.md` section 7 and
  `package-implementation-design.md` section 11 document it.
  - This is not outdated code; it is an intentional EDK extension. The table in
    SPEC section 17, subsection 5 should add `edk-algorithm` as a pure algorithm
    library, or the SPEC and EDK will remain inconsistent.

### 1.3 Every `examples/` directory is empty

- SPEC section 17, subsection 4 requires executable examples under
  `examples/report-publisher`, `examples/research-assistant`, and
  `examples/support-handoff`.
- SPEC section 17, subsection 10 provides a complete `PublishReport` flow.
- SPEC section 13, subsection 2 and section 17, subsection 13 treat harness
  engineering as a pressure-test case study and require runnable examples such
  as `report-publisher` and `research-assistant` in the EDK repository.
- Currently, all three directories are empty. `examples/README.md` also states
  that the example directories are placeholders for future executable examples.
- Another missing area is the seven-scenario cross-package matrix in
  `std-requirements/substrate-gaps.md` section 18: research assistant, report
  publisher, PR reviewer, PDF ingestion, browser capture, workflow planning,
  and evaluation run. `tests/fixtures/positive/edk_cross_package_matrix` covers
  only part of the test sources, while the complete `edk_cross_package_matrix`
  remains a placeholder listed as Package-Mode Blocked in `package-status.md`.

---

## 2. Effect and Action Model

### 2.1 EDK source now writes scoped action refs; verification is still blocked

- SPEC section 17, subsection 3 ("Effect Naming Rules") explicitly requires:
  ```text
  EdkHttp.request
  EdkWorkspace.write<R>
  ```
- EDK source has been moved to the target spelling in `effects.es` / `policy.es`
  and public effect rows:
  - `EdkHttp.request`;
  - `EdkWorkspace.read<R>` / `write<R>` / `list<R>`;
  - `EdkEmail.send` / `read`;
  - `EdkDb.query` / `exec`;
  - `EdkVector.search` / `write` and `EdkEmbedding.embed`;
  - `EdkBrowser.navigate` / `click` / `read`;
  - `EdkGitHub.issue_create<R>` / `pr_comment<R>` / `read<R>`.
- Runtime values such as method, host, path, account, store, and session stay in
  action payloads. The remaining gap is compiler, interpreter, and package
  metadata support for payload-aware trace-spec checks and replay. EDK must not
  put runtime values back into action `<...>` arguments merely to satisfy the
  current checks.

### 2.2 Action trace-spec templates do not express `Approval.request` or `Human` requirements

- SPEC section 04, subsection 1; section 17, subsections 2 and 9:
  ```etas
  spec PublishReportTrace: trace =
      +EdkWeb.search
      & +EdkWorkspace.write<"reports/**">
      & (Approval.request >> EdkEmail.send<WorkAccount>)
      & -EdkWorkspace.write<"src/**">;
  ```
- Legacy EDK `*_policies.es` files should migrate to
  `trace_specs/*_trace_specs.es` and use `spec Name: trace = ...`. Templates
  should no longer use `policy {}`, `allow`, `deny`, `require`, or `follows`.
  - They do not express the safe defaults in SPEC section 17, subsection 9:
    web, PDF, and document APIs should return `Untrusted` by default; writes,
    sends, and mutations should require approval through trace specs and expose
    idempotency keys; and path, account, host, tenant, and datasource dimensions
    should be effect or action parameters.
  - `EdkEmail.send` is explicitly identified as a high-impact action in SPEC
    section 17, subsection 9 and should require `Approval.request` before send,
    but no EDK template currently enforces this.

### 2.3 Effect naming and tag organization diverge from the SPEC

- The standard forms in SPEC section 17, subsection 3 are:
  ```text
  EdkHttp.request
  EdkWorkspace.write<R>
  EdkBrowser.navigate<domain>
  ```
- In the current EDK implementation:
  - `edk-http/src/edk/http/policy.es` places effects in
    `module edk.http.policy;`, rather than the `module edk.http.effects;`
    expected by SPEC section 2.5 and section 17, subsection 2. Other EDK
    packages use `edk.X.effects`; only `edk-http` uses the `edk.http.policy`
    name. `policy.es` should not remain the effect/action declaration module.
  - `edk-workspace/src/edk/workspace/effects.es` follows the SPEC naming.
  - `edk-vector/src/edk/vector/effects.es` declares two effects, `EdkVector`
    and `EdkEmbedding`. SPEC section 17, subsection 10 does not list embedding
    as a separate effect, while SPEC section 03, subsection 7 treats
    `EdkEmbedding.embed` as a package-defined effect, consistent with section
    17, subsection 3. The implementation is not outdated, but the section 17,
    subsection 10 table lists only `EdkVector.search` and `EdkVector.write` and
    therefore does not match the implementation.
  - `edk-email` now declares `EdkEmail.send` and `EdkEmail.read`. The remaining
    gaps concern trace-spec templates, approval, and package metadata validation.

---

## 3. `tool`, `agent`, `flow`, and `protocol`

### 3.1 There are no `agent` declarations

- SPEC section 03, subsections 1 and 6 fully define the `agent` keyword, for
  example:
  `agent Writer(input: ...) -> Report [model = "gpt-5.5", tools = [...], limits = [...], policy = ...] { ... }`.
- SPEC section 17, subsection 10 uses
  `agent Writer(...) [model = "gpt-5.5"] { ... }` as an EDK usage example.
- No `agent` or `public agent` declaration exists in the EDK repository. EDK
  defines `tool` declarations only.
- SPEC section 17, subsection 13, "EDK As A Language Design Pressure Test",
  requires EDK packages to integrate model calls through `agent`; this is not
  represented at all today.

### 3.2 There are no `protocol` declarations

- SPEC section 04, subsections 2 and 3 define the `protocol` declaration as an
  optional advanced feature.
- SPEC section 12, subsection 1 and section 13, subsection 1 list protocol
  engineering as a case study.
- Searching the EDK repository for `protocol` returns no declarations.

### 3.3 EDK tools do not fully use the model-callable boundary

- SPEC section 03, subsections 2 and 3 show:
  ```etas
  tool edk.web.search(query: SearchQuery) -> Array<Untrusted<SearchResult>> ![EdkWeb.search, Error<SearchError>];
  ```
- EDK declares tools in files such as `edk-email/src/edk/email/tools/mail.es`,
  `edk-vector/src/edk/vector/tools/retrieve.es`,
  `edk-docs/src/edk/docs/tools/convert.es`,
  `edk-workspace/src/edk/workspace/tools/files.es`, and
  `edk-browser/src/edk/browser/tools/page.es`. However:
  - Most tools call lower-level flows directly and do not place explicit
    `![...]` effect-row constraints on the model-callable surface. SPEC section
    17, subsection 6 requires tool wrappers to have explicit effect rows and
    expose trace-spec-visible dimensions such as account and host.
  - `edk-email` tools `send_email` and `search_mailbox` have no trace spec that
    expresses `Approval.request >> EdkEmail.send`, even though SPEC section 17,
    subsection 9 requires a high-impact trace-spec template for send.
  - The `retrieve_context` effect row in `edk-vector` declares only
    `EdkVector.search`; it omits `EdkEmbedding.embed`, which SPEC section 17,
    subsection 10 explicitly requires.

### 3.4 Many EDK flows use bare `perform X` rather than the SPEC `with` handler pattern

- SPEC section 05, subsection 3 and section 17, subsection 2 explicitly require
  public EDK APIs to apply package handlers with `with`.
- Most EDK flows use bare `perform` without `with EdkXDefault`:
  - `edk-email/src/edk/email/provider.es:122` and `:132` perform
    `EdkEmail.send(...)` and `EdkEmail.read(...)` without handlers.
  - `edk-workspace/src/edk/workspace/files.es:23-34` performs
    `EdkWorkspace.read/write/list` without handlers.
  - `edk-vector/src/edk/vector/store.es:119+` performs
    `EdkVector.search/write` without handlers.
  - Top-level functions in `edk-db/src/edk/db/sql.es` perform
    `EdkDb.query/exec` without handlers.
- Only `edk-http/api.es:34` uses
  `perform EdkHttp.request(normalized) with EdkHttpTransportDefault;`.
- This violates SPEC section 17, subsection 8: every user-facing EDK flow or
  tool intended to run by default must eventually apply its package
  implementation handler explicitly in Etas source.

### 3.5 Most packages have no `Default` handler

- SPEC section 17, subsection 6 requires each package to provide
  `let EdkXDefault = handler { ... }`, covering `action x => ... resume ...`.
- In the repository:
  - `edk-http/src/edk/http/handlers/default.es` and `preflight.es` exist and are
    used.
  - `edk-workspace/src/edk/workspace/handlers/` does not exist; only a README
    mentions handlers.
  - `edk-email` and `edk-web` have the same gap, as do the remaining packages.
- `package-status.md`, under "Default Handler Layout Status", acknowledges that
  other network, browser, filesystem, database, vector, document, PDF, and eval
  handler layouts remain blocked instead of being filled with fake responses or
  package-private host bindings. This is a documented but unresolved gap.

---

## 4. Approval, Human Interaction, and Memory

### 4.1 There is no use of `Approval.request`

- SPEC section 04, subsection 1 and section 17, subsection 9 require
  high-impact EDK actions to carry trace-spec constraints such as
  `Approval.request >> EdkEmail.send`.
- Searches for `Approval.request`, `Human`, and `approve(` return no results.
- There is no support package such as `edk.ui`; `edk.http.transport.es` raises
  directly on HTTP errors and provides no human gate.

### 4.2 There is no use of `MemoryRegion<S>` or `Store<K, V>`

- SPEC section 03, subsections 5 and 6 introduce `MemoryRegion<S>` and
  `Store<K, V>` for durable memory.
- Searches for `MemoryRegion` and `Store[` return no results in EDK.
- SPEC section 17, subsection 13 lists Memory Engineering as a case study. EDK
  contains no durable-memory package such as `edk.memory` or `edk.session`. The
  SPEC does not require such a package directly, but its `Memory.read<R>` and
  `Memory.write<R>` examples have nowhere to be demonstrated in EDK.

### 4.3 Untrusted return annotations are incomplete

- SPEC section 03, subsections 2 and 3 require external inputs to return
  `Untrusted<...>` values until they are sanitized.
- In the current implementation:
  - `edk-web/src/edk/web/effects.es` declares
    `action fetch(url) -> Untrusted<WebPage>`, which is aligned.
  - `edk-web/src/edk/web/trust.es` provides
    `sanitize_html(source_url, html) -> SanitizedHtml` and
    `sanitized_text(html) -> Sanitized<string>`, which is aligned.
  - `HttpResponse.body` in `edk-http/src/edk/http/types.es` is a
    `ResponseBody { media_type, raw, text }` field and is not wrapped in
    `Untrusted<...>`. SPEC section 17, subsection 6 explicitly states that web,
    HTTP, PDF, and document readers return `Untrusted<...>` unless a wrapper
    validates the data.
  - `EdkPdf.read(path)` in `edk-pdf/src/edk/pdf/effects.es` returns
    `PdfDocument`, although the end of SPEC section 17, subsection 15 says PDF
    output should be `Untrusted<...>` unless validated.

---

## 5. Concurrency and Limits

### 5.1 There is no concurrent `join`, `try_join`, `collect`, `race`, or `map_concurrent`

- SPEC section 16, subsection 4 lists the required MVP concurrency combinators:
  `join`, `try_join`, `collect`, `race`, and `map_concurrent`.
- The `PublishReport` example in SPEC section 17, subsection 10 does not use a
  combinator, but examples in SPEC section 16, subsections 3, 6, and 10 use
  `join(..., limit = [Concurrency(3), Tokens(80_000), WallTime(seconds(45))])`.
- Searches for `try_join`, `map_concurrent`, `race(`, and `collect(` return no
  results in EDK.
- The only uses of `join`, such as in
  `edk-web/src/edk/browser/pure/dom_snapshot.es`, are string joins like
  `return join(parts, "\n")`; they are not concurrency combinators.
- `Concurrency(n)` and `WallTime(...)` do not appear in EDK either.

### 5.2 EDK does not use `~ TraceSpec` conformance

- The current SPEC removed `follows` and replaced it with declaration
  conformance:
  `flow PublishReport(topic) -> EmailReceipt ~ ReportTrace { ... }` or
  `flow PublishReport(...) ~ (+EdkWeb.search & -Command.run<_>) { ... }`.
- Almost no flow in an EDK package is annotated with `~ TraceSpec`.
- Legacy policy files should migrate to `trace_specs/*.es`, define
  `spec X: trace = ...`, and be consumed by flows, tools, and agents through
  `~ X`.

### 5.3 Use of `limit`

- SPEC section 04, subsection 2 and section 16, subsection 10 emphasize that
  nondeterministic loops and concurrent scopes must have a `limit`.
- `edk-workspace/src/edk/workspace/path.es` uses
  `for part in split_path(value) limit Iterations(65536) { ... }`, which is
  aligned.
- `edk-email/src/edk/email/provider.es:62` and
  `edk-email/src/edk/email/pure/rfc5322.es` use similar
  `limit Iterations(...)` clauses, which are aligned.
- Network and crawl flows such as `edk-web/src/edk/web/crawl.es` have no `limit`
  protection. Crawl, retry, and potentially unbounded loops rely on test
  assumptions rather than source-level limits, despite the SPEC section 17,
  subsection 10 test requirement that crawl limits be enforced.
- Limit examples such as `Iterations(3)` and `Tokens(60_000)` from the Harness
  Engineering case study in SPEC section 13, subsection 2 are also nearly absent
  from EDK.

---

## 6. Types, Nominal Evidence, and Trust

### 6.1 EDK extensively uses paired raw+checked `Spec` types, a convention absent from the SPEC

- SPEC section 15, subsection 13.2; section 17, subsection 2.1; and section 17,
  subsection 7 require nominal types: public EDK APIs must not accept bare
  `string` values for high-impact resources. Convenience APIs may accept raw
  strings only at the boundary and must immediately parse or validate them into
  nominal evidence before calling action-backed APIs. The SPEC does not require
  an `XxxSpec` plus `Xxx` naming pair.
- EDK currently uses patterns such as:
  - In `edk-http/src/edk/http/types.es`: `HttpMethod = string`, `Host = string`,
    `Url = HttpUrl`, `PublicHttpUrl = HttpUrl`, `InternalHttpUrl = HttpUrl`,
    `UserHeaderName = HeaderName`, `WireHeaderName = HeaderName`,
    `HeaderSpec<N ~ HttpHeaderName>`, `HeaderEvidence<N ~ HttpHeaderName>`, and
    `Header = HeaderEvidence<UserHeaderName>`.
  - In `edk-email/src/edk/email/types.es`: `EmailAddress`, `EmailAddressSpec`,
    `EmailAccount`, `EmailAccountSpec`, `ProviderEndpoint`,
    `ProviderEndpointSpec`, `EmailHeaderSpec<N>`,
    `EmailHeader<N ~ UserSettableEmailHeader>`, and `TlsSmtpEndpoint`.
  - In `edk-github/src/edk/github/types.es`: `GitHubRepoRef`/`GitHubRepoSpec`,
    `BranchRef`/`BranchSpec`, `GitHubRestPath`/`GitHubRestPathSpec`,
    `ReviewPath`/`ReviewPathSpec`, `PullRequestRef<R, H, B>`/
    `PullRequestSpec<R, H, B>`, `ReviewComment<P>`/`ReviewCommentSpec<P>`,
    `GitHubQuery<P>`, and `RestRequestSpec<P>`.
- These type pairs implement an internal EDK invariant that external callers
  cannot construct evidence such as `EmailAddress(raw_string)` directly. This
  is consistent with the anti-forgery requirement in SPEC section 17,
  subsection 2.1, but the SPEC does not prescribe `Spec`/`Ref` paired names.
  The `edk.http` example in SPEC section 17, subsection 6 includes only
  `HttpRequest`, `HttpResponse`, and `Url`, not `UrlSpec` or
  `PublicHttpUrlSpec`.
- In other words, the SPEC requires nominal evidence, and EDK implements it
  through an unspecified naming convention. Either section 17, subsection 2.1
  should document the convention, or EDK should remove the `Spec` suffixes and
  adopt a SPEC-style checked constructor with a private `Raw` alias.

### 6.2 Overuse of `alias`

- SPEC section 02, subsection 6 states:
  > Transparent `alias` declarations are reserved for harmless abbreviations
  > such as primitive-shaped compatibility names.
- `edk-http/src/edk/http/types.es` contains:
  - `public alias Host = string;`
  - `public alias Port = i32;`
  - `public alias Url = HttpUrl;`, where `HttpUrl` is a record rather than a
    primitive.
  - `public alias Header = HeaderEvidence<UserHeaderName>;`, a parameterized
    type alias.
  - `public alias WireHeader = HeaderEvidence<WireHeaderName>;`
  - `public alias WorkspaceRootPath = WorkspacePath<WorkspaceRoot>;`
  - `public alias ReportPath = WorkspacePath<ReportsRoot>;`
- SPEC section 17, subsection 2.1 reserves transparent aliases for harmless,
  primitive-shaped compatibility names and requires nominal types produced by
  checked constructors for high-impact resources.
- EDK represents types such as `Url`, `Header`, and `WorkspaceRootPath` with
  aliases even though they should be nominal, while adding another nominal layer
  such as `type PublicHttpUrl = HttpUrl;`. This contradiction may not break the
  layered rule that `edk.http` is not `std.http.request`, but it is inconsistent
  with the SPEC alias restriction.

### 6.3 Many test fixtures still reference removed standard-library vocabulary

- `tests/diagnostics/removed-std-vocabulary.txt` explicitly lists `Web.search`,
  `Workspace.read`, `Db.query`, `Vector.search`, `Browser.navigate`,
  `Email.send`, `Payment.charge`, `Agentic.embed`, `Command.spawn`, and
  `Memory.migrate` as removed standard actions. SPEC sections 06 and 17 require
  these names to be removed from the effect/action registry. EDK correctly uses
  these fixtures to verify that a new frontend rejects them.
- Current EDK sources such as `edk-db/src/edk/db/sql.es` still import concrete
  modules such as `std.text.*` and `std.http.codec.*`. SPEC section 17,
  subsection 2.1 lists `std.net.tcp`, `std.stream`, `std.tls`, `std.fs`,
  `std.http.codec`, `std.codec.text`, `std.secret`, `std.crypto`, and
  `std.browser.protocol`. EDK uses some of these but does not implement
  `std.json` or an explicit `std.crypto.hmac_sha256` primitive, even though the
  SPEC section 17, subsection 14 discussion of `edk-github` requires
  `std.crypto.hmac_sha256<K>` over `SecretValue<K>`. This is an implementation
  gap rather than outdated design, but it is substrate explicitly required by
  SPEC section 17, subsection 7.

### 6.4 Byte payload types do not strictly match the SPEC wire-type boundary

- SPEC section 17, subsection 6 says that `std.http.codec` owns `HttpWire*`
  types, EDK owns `HttpRequest` and `HttpResponse`, and conversion is explicit.
- In `edk-http/src/edk/http/types.es`:
  - `HttpRequest` and `HttpResponse` are EDK-owned records.
  - `HttpWireRequest` and `HttpWireResponseHead` are imported directly from
    `std.http.codec`. `edk-http/src/edk/http/wire/lower_request.es` and
    `wire/decode_response.es` provide explicit lowering and decoding functions,
    and the `HttpWire*` naming matches SPEC section 17, subsection 6.
- The remaining discrepancy is that `RequestBody` contains both `raw: bytes`
  and `text: string` fields in `types.es:64-69`. The SPEC does not prohibit this,
  and section 17, subsection 7 says response bytes are returned through
  `ResponseBody.raw`, while package-local helpers decode bytes into text with
  `Replace`. However, the SPEC also notes that
  `edk.http.body.bytes` and `edk.http.body.response_bytes` currently carry
  encoded byte text in shared `RequestBody`/`ResponseBody` shapes and are not a
  substitute for public byte/text codec substrate. This is an acknowledged
  substrate-gap placeholder rather than final SPEC design.

---

## 7. Handlers, Mocks, and Tests

### 7.1 Only `edk-http` has a `Default` handler, although the SPEC requires default handling

- SPEC section 17, subsection 8 says every user-facing EDK flow or tool intended
  to run by default must eventually apply its package implementation handler
  explicitly in Etas source. Any action that escapes an EDK API is intentionally
  abstract and must be handled by the caller or application.
- Currently:
  - `edk-http/src/edk/http/handlers/default.es` and `preflight.es` implement
    `EdkHttpTransportDefault`, which is used by `request(...)` in `api.es`.
  - Other packages have no `handlers/default.es`; all of their `perform X`
    expressions lack `with EdkXDefault`.
- `package-status.md`, under "Default Handler Layout Status", confirms that
  default handlers for other packages remain unimplemented.

### 7.2 Most `mocks/` modules construct data rather than substitute handlers

- SPEC section 17, subsection 7 says mocks may replace low-level substrate
  actions or high-level EDK flows in test profiles.
- `edk-email/src/edk/email/mocks/mailbox.es`,
  `edk-workspace/src/edk/workspace/mocks/filesystem.es`, and
  `edk-vector/src/edk/vector/mocks/store.es` are helper flows that construct fake
  data; they are not handlers.
- There is no mock-handler entry such as `mock:edk.email.send`. Tests can run
  pure smoke cases only. `package-status.md`, under "Runtime Status", also states
  that mocks cannot execute real actions.

### 7.3 `package_smoke.es` is common, but the SPEC requires six broader test families

- SPEC section 17, subsection 12 requires golden effects, golden traces, policy
  examples, diagnostics, interpreter smoke tests, and substrate coverage.
- EDK has 30 `.txt` files under `tests/golden-effects/`, but they contain interim
  compiler observations and source-contract records, as acknowledged under
  "Golden Effect Status" in `package-status.md`. The SPEC expects source-level
  semantic contracts such as:
  `flow edk.workspace.files.write_text effects: [EdkWorkspace.write<R>, Error<IOError>] requested_actions: [EdkWorkspace.write<R>] determinism: NonDeterministic`.
  Current golden files do not contain this structured contract.
- `tests/golden-traces/` contains no actual trace files. SPEC section 17,
  subsection 12 requires stable structural trace comparisons, while
  `tests/blocked/edk-http-mock-dry-run-trace.txt` remains blocked.
- `tests/diagnostics/` contains no concrete expected output for negative cases;
  it has only the descriptive `removed-std-vocabulary.txt` file.
- Thirty `.txt` files under `tests/blocked/` record cases that cannot run because
  of frontend limitations. SPEC section 17, subsection 12 treats useful errors
  for negative examples as the goal; EDK acknowledges the gap but has not
  unblocked most cases.

### 7.4 Test fixtures bypass the package manager with `--no-config` and a temporary source-copy graph

- `package-status.md` repeatedly records commands such as
  `etas check --no-config /private/tmp/etas-...-check/...`. This verifies nominal
  behavior through temporary copied sources rather than the package manager.
- Its "Contract Boundaries" section says deterministic pure logic was verified
  with a temporary source-copy graph, which is not a package-manager substitute.
- This does not conflict with SPEC section 15, subsection 13 or section 17,
  subsection 3: EDK does not request a privileged compiler metadata path.
  However, SPEC section 15, subsection 13.5 requires every reachable bodyless
  tool in runnable package compilation to have a concrete binding, while many
  EDK runnable smoke tests require `--allow-net 127.0.0.1:<port>`. This does not
  meet the section 15, subsection 13.7 requirement that a final runnable package
  resolve every bodyless tool signature reachable from its entry points.

---

## 8. Substrate-Gap Documentation Compared with the SPEC

### 8.1 Substrate gaps follow the SPEC exception model, but some content is ahead of it

- `std-requirements/substrate-gaps.md` records that TCP/TLS streams can now be
  passed to `stream.read/write_all`, `HttpWireRequest` construction and
  `HttpWireResponse` decoding are available, and
  `std.codec.text.Strict/Replace/InvalidUtf8` is runtime-callable. It also says
  that full EDK HTTP success requires explicit host authorization and that
  execution without `--allow-net` fails closed.
- This aligns with SPEC section 17, subsection 7: temporarily missing substrate
  must be recorded as a gap and must not become the final public API design. EDK
  follows that route and does not use a host-binding backdoor.
- However, SPEC section 17, subsection 6 says that the public action recorded for
  policy and traces is `EdkHttp.request`, while the implementation handler may
  request lower-level substrate actions such as
  `Net.tcp_connect[std.net.tcp.host, std.net.tcp.port]`,
  `Tls.handshake[std.tls.server_name]`,
  `Stream.write[std.stream.stream]`, and
  `Stream.read[std.stream.stream]`. EDK now implements these pieces, but the
  literal expansion of the `EdkHttp.request` action scope is blocked on frontend
  parameterized action-scope support and does not yet match the SPEC wording.

### 8.2 The browser substrate gap matches the WebDriver/CDP requirement

- The "Browser Protocol" section of `substrate-gaps.md` explicitly lists missing
  WebDriver/CDP/WebSocket command transport; page, DOM, screenshot, and
  navigation-event handling; and policy-visible session/origin binding. This
  matches SPEC section 17, subsection 12, which says missing WebSocket or browser
  session substrate must be recorded as a substrate gap.
- EDK does not provide a placeholder declaration or minimal stub source for a
  standard WebSocket package. SPEC section 17, subsection 7 treats low-level
  primitives such as TLS, cryptography, encoding, and compression as standard
  substrate. `substrate-gaps.md` does not list WebSocket as a separate standard
  requirement; it only states that a future standard library must implement it.
  This follows the same substrate principle but lacks an implementation.

### 8.3 Several items mentioned by `accepted-primitives.md` are not surfaced here

- `std-requirements/accepted-primitives.md` exists. The EDK assumptions about
  `std.net.tcp`, `std.stream`, `std.tls`, `std.fs`, `std.http.codec`,
  `std.codec.text`, `std.secret`, `std.crypto`, and `std.browser.protocol` align
  with SPEC section 17, subsection 7. EDK sources import these modules and can run
  pure flows, but acceptance status is not summarized as an explicit enum in the
  repository; readers must inspect `accepted-primitives.md` to determine it.

---

## 9. CLI and Tool Integration

### 9.1 EDK contributes no CLI commands

- SPEC section 17, subsection 12, "Checks And Golden Tests", lists:
  ```text
  etas check --workspace
  etas effects --workspace
  etas test --workspace
  etas trace examples/report-publisher
  etas edk golden --check
  ```
- There is no sign of an `etas edk` subcommand in EDK. `package-status.md`
  mentions `etas pkg lock`, `etas check --no-config`, and `etas run .`, but these
  are compiler commands rather than EDK contributions.
- SPEC section 17, subsection 13 also implies an EDK-specific checker such as
  `etas edk golden --check`; EDK does not implement one.

### 9.2 Package manifests lack profile and binding configuration beyond `[[bin]]`

- SPEC section 15, subsection 12 defines tool bindings:
  ```toml
  [bindings.tools]
  "web.search.search" = { kind = "mcp", server = "browser", tool = "search" }
  ```
- SPEC section 17, subsection 7 defines mocks:
  ```toml
  [bindings.profile.test]
  edk.web.search = "mock:edk.web.search"
  ```
- EDK package manifests contain `[[bin]]` only. They have neither
  `[bindings.tools]` nor `[bindings.profile.test]`, so EDK does not expose its
  public flows and tools as bindable entries.

---

## 10. Other SPEC Requirements Missing from EDK

The following requirements are explicit in the SPEC, but no corresponding EDK
implementation can be found:

| SPEC location | Requirement | Current EDK state |
|---|---|---|
| Section 02.1 | Lexical four-space indentation, 20 primitive types, and `Index` indexing | EDK does not exercise these directly; it does not implement the syntax layer. |
| Section 02.6 | `alias` is reserved for transparent abbreviations | `edk-http/types.es` violates this with aliases such as `alias Url = HttpUrl;`. |
| Section 03.1 | `agent Writer(...)` with annotations and trace-spec conformance | No agent declarations. |
| Section 03.5 | `MemoryRegion<S>` and `Store<K, V>` | No uses. |
| Section 03.7 | `Prompt`, `PromptPart`, `Message<T>`, and `Conversation` | No uses; these should appear in harness examples. |
| Section 04.2 | `protocol X { ... }` declarations | No uses. |
| Section 04.2 | Concurrent `join([...])` combinator | Only string joining appears; no concurrent semantics. |
| Section 04.2 | Mandatory `limit` clauses | Most crawl and loop flows have no `limit`. |
| Section 05.3 | `Error<E>.raise(...) -> never` and postfix `?` to convert `Result` | EDK often writes `perform Error<X>.raise(...)`; the semantics are similar, but the SPEC emphasizes a single explicit `Error<E>`. |
| Section 06.5 | `Agentic.infer<A>` is a requested action, not an escaping effect | EDK defines `EdkEmbedding.embed<M>` consistently with SPEC section 03.7, but the `retrieve_context` tool effect row omits `EdkEmbedding.embed`. |
| Section 06.6 | `DefaultCommandSandbox` and `SandboxProfile` support values | No uses. |
| Section 07.2 | The `SafeResearch` example flow | No example. |
| Section 13.1 | Analyzable surfaces for the seven Harness, Memory, AgentOps, Eval, Tool Governance, Orchestration, and Recovery case studies | Only partial coverage through scattered negative fixtures; no case-study-shaped harness source. |
| Section 14.3 | Banned primitive lists and static residual checks | EDK does not provide these. `negative_action_scope_gap` verifies literal action scope, but residual checks are absent from source. |
| Section 15.13.7 | Runnable packages resolve every bodyless tool | Most EDK tools have source bodies, so there is no binding-validation path. |
| Sections 16.3-16.11 | `join`, `try_join`, `collect`, `race`, `map_concurrent`, and `Concurrency(n)` | No uses. |
| Section 17.5 | Twelve first-wave packages | EDK adds `edk-algorithm`; the SPEC should be updated. |
| Section 17.6 | Tool wrappers have explicit `![...]` | `send_email` in `edk-email/tools/mail.es` has no `Approval.request`, conflicting with the high-impact template in section 17.9. |
| Section 17.7 | Substrate-gap fields: Package, Attempted implementation, Missing primitive, Desired signature, Safety impact, Alternative considered | `substrate-gaps.md` uses free-form prose and omits some fields. |
| Section 17.8 | Package metadata must not contain an `actions.default_handlers` runtime fallback table | EDK does not state this rule explicitly. The README implies it, but the SPEC expects an explicit rule. |
| Section 17.9 | Safe defaults: `Untrusted` returns, idempotency keys, and trace-spec templates | EDK templates omit `Approval.request >> ...`, idempotency keys, and some `Untrusted` annotations for HTTP/PDF bodies. |
| Section 17.10 | `flow PublishReport ... ~ ReportTrace` example | No source under `examples/report-publisher/`. |
| Section 17.12 | Six test families covering package/type checking, effect summaries, trace-spec and handler examples, golden traces, interpreter smoke, diagnostics, and substrate | Golden effects, golden traces, and diagnostics contain no substantive structured coverage. |
| Section 17.13 | Every EDK package includes small executable examples | EDK has `package_smoke.es`, but `examples/` is empty. |

---

## 11. High-Level Difference Summary

| Topic | SPEC expectation | Current EDK state | Severity |
|---|---|---|---|
| Workspace | Root `etas.toml` has `[workspace.dependencies]` and a root `etas.lock` | Root has members but no unified lock; package manifests do not declare all EDK interdependencies | Medium |
| Examples | Three executable `examples/*` projects | All three directories are empty | High |
| `agent` / `protocol` | Defined by the SPEC and used by section 17 examples | No declarations | High |
| `~ TraceSpec` | Used in section 17.10 | Almost unused | High |
| `Approval.request >> Action` trace spec | Required by section 17.9 templates | No uses | High |
| Static effect/action families and payload trace specs | Section 17.3 naming rules | Source has migrated to static families plus runtime payloads; payload-aware trace specs and package metadata remain blocked | High |
| Default handlers | Section 17.8 requires explicit handler application | Only `edk-http` has one; the other 12 packages use bare `perform` | High |
| Default `Untrusted<...>` | Sections 17.9 and 17.6 | HTTP response bodies and PDF outputs are not annotated | Medium |
| `join`/`try_join`/`collect`/`race`/`map_concurrent` | Section 16.4 | No concurrent uses; only string `join` | Medium |
| `Concurrency(n)` and `WallTime(...)` | Section 16.10 | No uses | Medium |
| `MemoryRegion`/`Store` | Section 03.6 | No uses | Medium |
| Mock handlers | Section 17.7 | Data constructors only, not handlers | Medium |
| Package-mode verification | Section 17.12 | `edk-algorithm`, `edk-workspace`, `edk-http`, `edk-email`, `edk-vector`, and `edk-web` check/run; `edk-browser` checks but cannot run without a real Network/browser host handler; `edk-git`, `edk-github`, and others remain blocked in `package-status.md` | High |
| Golden effects and traces | Section 17.12 | Interim prose only; no structured contracts | Medium |
| `alias` constraints | Section 17.2.1 | `edk-http/types.es` violates them with aliases such as `alias Url = HttpUrl` | Medium |
| Paired raw+checked `Spec`/`Ref` convention | Not defined by the SPEC | Internal EDK convention that should be documented in section 17.2.1 | Low: misalignment rather than lag |
| Whether `edk-algorithm` belongs to the first wave | Not listed in section 17.5 | Included by EDK; should be added to the SPEC | Low: intentional extension |
| CLI commands such as `etas edk golden` | Section 17.12 | Not implemented in EDK | Medium |
| `[bindings.profile.test]` | Section 17.7 | Missing from package manifests | Medium |
| `Idempotency-Key` and replay metadata | Section 17.9 and `tests/blocked/edk-email-send-replay-metadata.txt` | Not declared for EDK send/create_issue; still blocked | Medium |

---

## 12. Recommended Next Steps, Ordered by Benefit

1. **Make `examples/` executable**: give `report-publisher`,
   `research-assistant`, and `support-handoff` at least one flow that runs with
   `etas run` and `--allow-net 127.0.0.1`. Use `~ TraceSpec` and
   `Approval.request >> Action` to align with SPEC section 17, subsection 10.
2. **Add default handlers for `edk-email`, `edk-workspace`, `edk-db`,
   `edk-github`, and the other packages**, and wrap `perform X` in public flows
   with `with EdkXDefault`, as required by SPEC section 17, subsection 8.
3. **Validate the action boundary**: EDK source already uses target forms such as
   `EdkHttp.request`, `EdkWorkspace.write<R>`, and `EdkBrowser.navigate`. Next,
   implement runtime-payload trace-spec checks and package metadata replay.
4. **Add `Untrusted<...>` annotations**: `HttpResponse.body`, `PdfDocument`, and
   `CrawlResult.body` should be untrusted and paired with
   `sanitize(...) -> Sanitized<...>` operations.
5. **Implement trace-spec templates**: put the section 17, subsection 9
   `+A`, `Approval.request >> A`, and `-B` templates under `trace_specs/`, and
   make example flows conform with `~`.
6. **Clean up aliases**: replace forms such as `alias Url = HttpUrl;` with
   nominal definitions such as `type Url = HttpUrl;` to comply with SPEC section
   17, subsection 2.1.
7. **Declare interdependencies and bindings in `etas.toml`**: record package
   dependencies such as `edk-email`, `edk-web`, and `edk-github` on `edk-http`,
   and add `[bindings.profile.test]` plus mock declarations from SPEC section 17,
   subsection 7.
8. **Create structured golden effects and traces**: convert
   `tests/golden-effects/*.txt` from interim observations to the source-level
   semantic contracts in SPEC section 17, subsection 12, with `effects`,
   `requested_actions`, and `determinism`; populate `tests/golden-traces/` with
   structural trace expectations.
9. **Update SPEC section 17, subsection 5** to list `edk-algorithm` as a
   first-wave package, or explicitly state in EDK that it is outside that set.
10. **Add an EDK self-check CLI**, such as `etas edk golden --check`, to realize
    the checks and golden-test workflow in SPEC section 17, subsection 12.

---

## Appendix: SPEC Files Reviewed

`etas/docs/design/01-overview.md`, `02-general-programming-constructs.md`,
`03-agents-tools-prompts-memory.md`, `04-flows-human-gates-and-protocols.md`,
`05-type-system-and-errors.md`, `06-effect-system-and-inference.md`,
`07-examples.md`, `08-formal-core-static-analyses-and-pl-context.md`,
`09-syntax-principles.md`, `10-implementation-strategy.md`,
`11-agent-intermediate-representation.md`,
`12-application-boundaries-and-framework-coverage.md`, `13-case-studies.md`,
`14-safety-analysis-static-dynamic.md`, `15-package-management.md`,
`16-concurrency.md`, and `17-edk-official-packages.md`.

## Appendix: EDK Files Reviewed

- Root: `README.md`, `etas.toml`,
  `docs/architect/{edk-architecture.md, package-layout.md, package-implementation-design.md}`,
  `packages/README.md`, `tests/package-status.md`,
  `std-requirements/substrate-gaps.md`, and
  `tests/diagnostics/removed-std-vocabulary.txt`.
- Packages: `edk-http` (`etas.toml`, `README.md`, `policy.es`, `types.es`,
  `api.es`, `transport.es`); `edk-workspace` (`types.es`, `effects.es`,
  `path.es`, `files.es`, `trace_specs/workspace_trace_specs.es`); `edk-email`
  (`effects.es`, `provider.es`, `tools/mail.es`,
  `trace_specs/email_trace_specs.es`); `edk-pdf` (`effects.es`); and
  `edk-vector` (`effects.es`, `trace_specs/vector_trace_specs.es`).
- Repository-wide searches verified the absence of `agent`, `protocol`,
  `follows`, `Approval`/`Approval.request`/`approve(`, `Concurrency(`,
  `WallTime(`, `try_join`/`map_concurrent`/`race(`/`collect(`,
  `MemoryRegion`/`Store`; and inspected the usage scope of
  `PublicNetworkTarget` and `Untrusted` annotations.

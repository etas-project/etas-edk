# EDK Package Implementation Design

This document designs the code-level structure of every first-wave EDK package.
It names future `.es` modules, public API contracts, package-handler
boundaries, mocks, policies, and tests, but it does not add implementation
source files.

## 1. Shared Implementation Pattern

Every package should use the same internal layering unless a package-specific
reason is documented.

```text
packages/edk-name/
  etas.toml
  src/edk/name/
    effects.es          # public package-owned effect/action declarations
    types.es            # public stable API data types
    errors.es           # package error data types used by Error<E>
    pure/                # deterministic parsing, normalization, codecs, planning
    flows/               # ordinary public source APIs
    tools/               # explicit model-callable wrappers
    handlers/            # package implementation handlers and alternate test handlers
    mocks/               # deterministic test handlers and fake clients
    trace_specs/         # suggested `spec ...: trace` templates
  tests/
    positive/
    negative/
    golden-effects/
    golden-traces/
    interpreter-smoke/
```

The module names follow source paths:

```text
src/edk/http/client.es       -> module edk.http.client
src/edk/workspace/files.es   -> module edk.workspace.files
```

Package distribution names use kebab-case, while module import roots use dotted
names:

```text
edk-http       -> import edk.http.*
edk-workspace  -> import edk.workspace.*
```

## 2. Public API Rules

Every public EDK package must separate the following concerns:

| Concern | Location | Rule |
|---|---|---|
| Effect/action declarations | `effects.es` | Package-owned names such as `EdkHttp.request`, never old std names such as `Web.search` |
| Public data model | `types.es` | Stable serialized shape where package metadata exposes it |
| Public errors | `errors.es` | Used through `Error<PackageError>` |
| Pure implementation | `pure/` | No host effects; deterministic and reusable |
| Public flows | `flows/` or top-level module | Explicit public effect rows |
| Tool surfaces | `tools/` | Model-callable wrappers only, never implicitly exposed |
| Package implementation handlers | `handlers/default.es` | Etas implementation over lower-level EDK or public `std` substrate, applied explicitly by public APIs |
| Mocks | `mocks/` | Deterministic replacement handlers for tests |
| Trace specs | `trace_specs/` | Suggested `spec ...: trace` templates |

Public flows and tools must not be opaque bodyless host bindings. If a public
operation cannot be implemented over public lower-level APIs, the package must
record a substrate gap and leave the implementation pending.

Low-level standard substrate accepted by the language design may be used by
package implementation handlers and reference implementations:

| EDK need | Public std substrate | Action owner |
|---|---|---|
| TCP and network streams | `std.net.tcp`, `std.stream` | `Net`, `Stream` |
| TLS | `std.tls` | `Tls` |
| Project-scoped filesystem | `std.fs` | `Fs` |
| HTTP framing | `std.http.codec` | none, pure over std-owned `HttpWire*` types |
| Text/byte codecs | `std.codec.text` | none, pure |
| Secret reads | `std.secret` | `Secret` |
| Public hash/constant-time compare | `std.crypto` | none for deterministic helpers over ordinary `bytes` |
| Secret-backed HMAC/signatures | `std.crypto` over `SecretValue<K>` | `Secret.use<K>` |
| Browser protocol transport | `std.browser.protocol` | `Browser` |

EDK must not create package-private replacements for these APIs. If an accepted
substrate primitive is not implemented yet, the package keeps the source
implementation blocked and records the implementation gap.

## 3. Effect Naming Rules

EDK actions are package-owned authority facts:

```text
EdkHttp.request
EdkWeb.search
EdkWorkspace.write<R>
EdkEmail.send
EdkDb.query
EdkVector.search
EdkBrowser.navigate<domain>
EdkGit.write
EdkGitHub.issue_create<R>
EdkPdf.read
EdkDocs.convert
EdkEval.write
```

These actions may extend core roots such as `Network`, `FileIO`, `Human`,
`Command`, `Memory`, or `Agentic`, but they are not part of `std`.

Public EDK action parameters must expose trace-spec-relevant scope:

- host/domain for network operations;
- path or path scope for workspace/PDF/docs operations;
- account/tenant for email and SaaS operations;
- datasource/store for database and vector operations;
- repository for Git/GitHub operations;
- suite or artifact root for evaluation operations.

## 4. Metadata Rules

Each package manifest eventually needs package metadata for:

- exported modules and symbols;
- public type signatures;
- effect/action declarations;
- tool schemas;
- trust labels such as `Untrusted<...>`;
- determinism classification;
- idempotency/replay metadata;
- mock binding identifiers.

The metadata is consumed through ordinary package management. EDK does not get a
compiler-private metadata path. Package metadata must not contain an
`actions.default_handlers` runtime fallback table. If a package provides default
behavior, its public source API applies the package handler explicitly with
`with`; an escaping action always means caller/application responsibility.

## 5. `edk-http`

Purpose: typed HTTP requests, response parsing, JSON helpers, and auth-neutral
client wrappers.

Dependencies:

```text
edk-http -> std
```

Source layout:

```text
packages/edk-http/src/edk/
  http.es                         # module edk.http; root API
  http/
    effects.es
    types.es
    errors.es
    json.es

    client/
      mod.es                      # module edk.http.client
      config.es                   # HttpClientConfig / HttpClient
      request.es                  # configured generic request only
      defaults.es                 # default_config / default_client

    body/
      mod.es
      bytes.es
      text.es
      json.es

    url/
      mod.es
      parse.es
      normalize.es
      validate.es
      scope.es                    # method/host/port/scheme trace-spec scope

    headers/
      mod.es
      normalize.es
      validate.es
      build.es

    wire/
      lower_request.es            # HttpRequest -> std HttpWireRequest
      decode_response.es          # std HttpWire* + bytes -> HttpResponse
      body_limit.es

    pure/
      method.es
      status.es
      redirect.es
      retry_plan.es
      ssrf.es

    handlers/
      default.es

    mocks/
      server.es
      routes.es
      responses.es

    trace_specs/
      http_policies.es
```

If the package loader cannot support `src/edk/http.es` and `src/edk/http/` as
siblings, that is a package-layout/compiler gap to record explicitly. Do not
replace this design with one-to-one forwarding files whose only purpose is to
mirror `client` functions.

Public effect contract:

```text
effect EdkHttp extends Network {
  action request(request: HttpActionRequest) -> HttpActionResponse;
}
```

Concrete action facts use the static family `EdkHttp.request`. The
normalized method and host stay in the runtime action payload for trace specs and
trace checks.

Public types:

- `HttpMethod`;
- `Url`;
- `Host`;
- `PathAndQuery`;
- `Header`;
- `Headers`;
- `HttpRequest`;
- `HttpResponse`;
- `HttpClient`;
- `HttpClientConfig`;
- `StatusCode`;
- `RequestBody`;
- `ResponseBody`;
- `Timeout`;
- `BodyLimit`;
- `RequestOptions`;
- `RetryPolicy`;
- `TlsPolicy`;
- `ProxyConfig`;
- `AuthConfig`;
- `CookiePolicy`;
- `RedirectPolicy`.

Errors:

- `HttpError`;
- `UrlParseError`;
- `HeaderError`;
- `TransportError`;
- `TlsError`;
- `TimeoutError`;
- `RedirectError`;
- `StatusError`;
- `BodyLimitError`;
- `CodecError`;
- `PolicyScopeError`.

Implementation shape:

- `edk.http` exposes root generic APIs: `request`, `get`, `post`, `put`,
  `patch`, `delete`, and `head`;
- `edk.http.client` exposes only configured generic client construction APIs:
  `new`;
- no `client.get`, `client.post`, `client.post_json`, `client.fetch_text`, or
  `client.fetch_json` APIs should exist, and no root `post_json`/`fetch_json`
  shortcut should exist until a typed JSON layer is available;
- pure modules implement URL parsing, header normalization, redirect/retry
  planning, SSRF checks, request lowering, and response decoding;
- user-facing public flows and tools apply `EdkHttpDefault` internally and expose
  `![Error<HttpError>]` plus requested-action/trace facts for
  `EdkHttp.request`;
- `handlers/default.es` is the source implementation over public `std.net.tcp`,
  `std.tls`, `std.stream`, and `std.http.codec` substrate;
- missing or incomplete stream/network/TLS/codec runtime support is an
  implementation gap, not permission to add a private HTTP host binding.

Root API shape:

```text
edk.http.request(req: HttpRequest)
  -> HttpResponse ![Error<HttpError>]

edk.http.get(url: string, options: RequestOptions)
  -> HttpResponse ![Error<HttpError>]

edk.http.post(url: string, body: RequestBody, options: RequestOptions)
  -> HttpResponse ![Error<HttpError>]

edk.http.put(url: string, body: RequestBody, options: RequestOptions)
  -> HttpResponse ![Error<HttpError>]

edk.http.patch(url: string, body: RequestBody, options: RequestOptions)
  -> HttpResponse ![Error<HttpError>]

edk.http.delete(url: string, options: RequestOptions)
  -> HttpResponse ![Error<HttpError>]

edk.http.head(url: string, options: RequestOptions)
  -> HttpResponse ![Error<HttpError>]
```

Configured client API shape:

```text
edk.http.client.new(config: HttpClientConfig) -> HttpClient
```

`edk.http.client` is not a convenience namespace. It represents reusable
configuration values only. Public execution goes through the root
`edk.http.request/get/post/put/patch/delete/head` API so there is one checked
HTTP action boundary.

Default source implementation layering is fixed:

```text
edk.http.request(req) or edk.http.get/post/put/patch/delete/head(url, ...)
  -> performs package-owned EdkHttp.request
  -> handles it immediately with EdkHttpDefault in source
  -> applies HttpClientConfig defaults
  -> validates method, URL, headers, body limit, timeout, redirect policy,
     replay/idempotency metadata, and SSRF trace-spec scope
  -> lowers the EDK HttpRequest into std HttpWireRequest
  -> opens TCP with std.net.tcp.connect
  -> upgrades to TLS with std.tls.connect when the URL scheme requires it
  -> writes encoded bytes with std.stream.write_all
  -> reads bounded response bytes with std.stream.read_until_limit
  -> decodes wire response head/body with std.http.codec and package pure code
  -> returns the user-facing HttpResponse or Error<HttpError>
```

`std.http.codec` is not a client and has no host authority. It only encodes and
decodes std-owned `HttpWire*` records. `edk.http.types.HttpRequest` and
`HttpResponse` are EDK-owned stable API records; conversion between EDK records
and `HttpWire*` records must be explicit and test-covered.

The `std.stream.*` calls rely on spec-bound polymorphism:
`std.tls.connect` returns `TlsStream`, and `std.stream.write_all` /
`std.stream.read_until_limit` accept it through `S ~ ByteStream`. EDK must not
add a private HTTP host binding, fake stream wrapper, or source-level subtype
workaround when this spec bound is missing from the compiler.

`post` accepts a `RequestBody` and must not guess whether a value is bytes, text,
JSON, form data, or a stream. Typed JSON helpers remain blocked until a real
JSON value and codec layer exists; do not publish stringly `post_json` or
`fetch_json` shortcuts as a substitute.

The public application-level trace-spec surface should usually be
`EdkHttp.request`. The EDK public API must not expose this action
as an escaping effect when it supplies the default implementation internally.
The action still remains visible in requested-action and trace facts. The package
handler implementation also produces checked lower-level facts such as
`Net.tcp_connect[std.net.tcp.host, std.net.tcp.port]`,
`Tls.handshake[std.tls.server_name]`, `Stream.write[std.stream.stream]`, and `Stream.read[std.stream.stream]` for
runtime authority, trace, replay, and deployment manifests. Both layers must be
visible; neither layer may be silently collapsed into the other.

Do not add any of the following:

- `std.http.request`;
- `etas_host::http_client` as a source-visible host service;
- a bodyless EDK HTTP tool that directly calls a private HTTP host binding;
- `edk.http.client.get`;
- `edk.http.client.post`;
- `edk.http.client.post_json`;
- `edk.http.client.fetch_text`;
- `edk.http.client.fetch_json`;
- fake handlers that return empty responses or mock data in production;
- compiler/frontend special cases for `edk.http.client`.

Tool layer:

- future typed tool wrappers may be added only after typed JSON/body codecs and
  explicit tool-call runtime semantics exist.

Tools are model-callable, schema-constrained operations. Do not expose a
universal arbitrary request tool by default, and do not place tool APIs under
`edk.http.client`.

Tests:

- import/use coverage for `edk.http.{request, get, post, put, patch, delete, head}`;
- import/use coverage for `edk.http.client.new`;
- golden effects for root API and configured client API, proving
  `EdkHttp.request` is requested/traced but does not escape when
  the API applies `EdkHttpDefault`;
- package-handler golden effects proving lower-level `Net.tcp_connect`,
  `Tls.handshake`, `Stream.write`, and `Stream.read` facts are retained;
- golden effects for `get`, `post`, redirect, and timeout paths;
- negative trace-spec cases for disallowed host/method;
- negative cases for invalid URL, CRLF header injection, unsupported
  method/scheme, SSRF/private host, body-limit overflow, and redirect loops;
- pure parser tests for URLs, headers, and response decoding;
- deterministic mock server tests.

## 6. `edk-web`

Purpose: search, fetch, crawl, and web content normalization. External content
must be untrusted by default.

Dependencies:

```text
edk-web -> edk-http -> std
```

Source layout:

```text
packages/edk-web/src/edk/web/
  effects.es
  types.es
  errors.es
  search.es
  fetch.es
  crawl.es
  trust.es
  pure/html_extract.es
  pure/robots.es
  pure/canonical_url.es
  handlers/default.es
  handlers/dry_run.es
  mocks/search_index.es
  tools/search.es
  tools/fetch.es
  trace_specs/web_trace_specs.es
```

Public effect contract:

```text
effect EdkWeb extends Network {
  action search(query: SearchQuery) -> Array<Untrusted<SearchResult>>;
  action fetch(url: Url) -> Untrusted<WebPage>;
  action crawl(start: Url, policy: CrawlPolicy) -> CrawlResult;
}
```

Concrete fetch/crawl facts use the normalized target URL or start URL.

Public types:

- `SearchQuery`;
- `SearchResult`;
- `WebPage`;
- `WebSnippet`;
- `CrawlPolicy`;
- `CrawlResult`;
- `RobotsDecision`;
- `SanitizedHtml`;
- `WebFetchOptions`.

Errors:

- `WebError`;
- `SearchError`;
- `FetchError`;
- `RobotsError`;
- `ContentTooLargeError`;
- `UnsupportedContentTypeError`.

Implementation shape:

- `fetch.es` builds on the package API `edk.http.get` or constructs an
  `HttpRequest` and calls `edk.http.request` when custom configuration is
  required;
- `search.es` provides a provider-neutral API with provider or mock handlers;
- `crawl.es` composes `fetch`, robots checks, normalization, and explicit
  limits;
- `trust.es` exposes explicit sanitize/validate flows before content can become
  trusted.

Public flows:

```text
search(query) -> Array<Untrusted<SearchResult>>
  ![EdkWeb.search, Error<SearchError>]

fetch(url) -> Untrusted<WebPage>
  ![EdkWeb.fetch, Error<FetchError>]

crawl(start, policy) -> CrawlResult
  ![EdkWeb.crawl, EdkWeb.fetch, Error<WebError>]
```

Tool layer:

- `search_web(query)`;
- `fetch_page(url)`;
- `crawl_site(start, limit)`.

Tests:

- `EdkWeb.fetch<domain>` appears in effect summaries;
- `Untrusted` labels are preserved;
- crawl limits are enforced;
- mock search/fetch runs without network.

## 7. `edk-workspace`

Purpose: project-local file access with normalized paths, trace-spec-visible scopes,
and safe write behavior.

Dependencies:

```text
edk-workspace -> std
```

Source layout:

```text
packages/edk-workspace/src/edk/workspace/
  effects.es
  types.es
  errors.es
  path.es
  files.es
  glob.es
  snapshot.es
  pure/path_normalize.es
  pure/glob_match.es
  handlers/default.es
  handlers/dry_run.es
  mocks/filesystem.es
  tools/files.es
  trace_specs/workspace_trace_specs.es
```

Public effect contract:

```text
effect EdkWorkspace extends FileIO {
  action read<R ~ WorkspaceRegion, P ~ ReadablePath<R>>(path: P) -> bytes;
  action write<R ~ WorkspaceRegion, P ~ WritablePath<R>>(path: P, body: bytes) -> unit;
  action list<R ~ WorkspaceRegion, P ~ ListablePath<R>>(path: P) -> Array<WorkspaceEntry>;
}
```

`R` is the workspace region marker and `P` is checked path evidence for that
region. Concrete action arguments still preserve the normalized path for trace specs,
trace, and runtime residual checks.

Public types:

- `WorkspaceRoot`;
- `ReportsRoot`;
- `WorkspaceRegion`;
- `WorkspacePath<R ~ WorkspaceRegion>`;
- `WorkspaceRootPath`;
- `ReportPath`;
- `ReadablePath<R>`;
- `WritablePath<R>`;
- `ListablePath<R>`;
- `PathScope`;
- `Glob`;
- `WorkspaceEntry`;
- `FileStat`;
- `WriteMode`;
- `AtomicWriteOptions`;
- `WorkspaceSnapshot`;
- `WorkspaceDiff`.

Errors:

- `WorkspaceError`;
- `PathEscapeError`;
- `NotFoundError`;
- `PermissionError`;
- `ConflictError`;
- `InvalidGlobError`.

Implementation shape:

- pure modules normalize paths and match globs;
- path escape must be rejected before any host filesystem substrate is used;
- writes use atomic replace semantics when available;
- package implementation handlers use `std.fs` once implemented;
- missing filesystem implementation is a substrate gap, not permission to hide
  file access inside `EdkWorkspace.*` host calls.

Public flows:

```text
read<R ~ WorkspaceRegion, P ~ ReadablePath<R>>(path: P) -> bytes
  ![EdkWorkspace.read<R>, Error<WorkspaceError>]

read_report_path<P ~ ReadablePath<ReportsRoot>>(path: P) -> bytes
  ![EdkWorkspace.read<R>, Error<WorkspaceError>]

write<R ~ WorkspaceRegion, P ~ WritablePath<R>>(path: P, body, mode) -> unit
  ![EdkWorkspace.write<R>, Error<WorkspaceError>]

list<R ~ WorkspaceRegion, P ~ ListablePath<R>>(path: P) -> Array<WorkspaceEntry>
  ![EdkWorkspace.list<R>, Error<WorkspaceError>]
```

Tool layer:

- `read_bytes<R ~ WorkspaceRegion, P ~ ReadablePath<R>>`;
- `write_bytes<R ~ WorkspaceRegion, P ~ WritablePath<R>>`;
- `list_files<R ~ WorkspaceRegion, P ~ ListablePath<R>>`;
- `apply_patch` only after patch validation is implemented.

Tests:

- path escape rejection;
- scope matching;
- denied write path rejection;
- dry-run handler behavior;
- golden traces for read/write/list.

## 8. `edk-email`

Purpose: email composition, sending, reading, provider-neutral message types,
and account-scoped authority.

Dependencies:

```text
edk-email -> edk-http -> std
```

SMTP modules may require lower-level stream/TLS substrate. Provider modules may
use `edk-http`.

Source layout:

```text
packages/edk-email/src/edk/email/
  effects.es
  types.es
  errors.es
  address.es
  message.es
  smtp.es
  provider.es
  pure/rfc5322.es
  pure/mime.es
  pure/address_parse.es
  handlers/default.es
  handlers/draft_only.es
  mocks/mailbox.es
  tools/mail.es
  trace_specs/email_trace_specs.es
```

Public effect contract:

```text
effect EdkEmail extends Network {
  action send<A ~ DeliverableAddress>(account: EmailAccount, draft: EmailDraft<A>) -> EmailReceipt;
  action read(account: EmailAccount, query: EmailQuery) -> Array<EmailMessage>;
}
```

`A` is deliverable address evidence. The account remains runtime payload data
for trace specs and runtime trace.

Public types:

- `EmailAccount`;
- `EmailAccountSpec`;
- `EmailAddress`;
- `DeliverableAddress`;
- `EmailDraft<A ~ DeliverableAddress>`;
- `EmailMessage`;
- `EmailAttachment`;
- `EmailReceipt`;
- `EmailQuery`;
- `ProviderEndpoint`;
- `TlsSmtpEndpoint`;
- `MailboxPage`;
- `MimePart`.

Errors:

- `EmailError`;
- `AddressError`;
- `MimeError`;
- `SmtpError`;
- `ProviderError`;
- `RateLimitError`.

Implementation shape:

- pure modules encode/decode addresses and MIME;
- `draft` is pure;
- provider-specific flows use `edk-http`;
- SMTP flows use public stream/TLS substrate when available;
- `send` is non-idempotent and must publish idempotency/replay metadata.

Public flows:

```text
send(account, draft) -> EmailReceipt
  ![EdkEmail.send, Error<EmailError>]

read(account, query) -> Array<EmailMessage>
  ![EdkEmail.read, Error<EmailError>]

draft(to, subject, body) -> EmailDraft
```

Tool layer:

- `draft_email`;
- `send_email`;
- `search_mailbox`.

Trace-spec templates should require `Approval.request` before `EdkEmail.send<A>`.

Tests:

- invalid address diagnostics;
- send requires approval under suggested trace spec;
- draft-only handler handles send without delivery;
- idempotency metadata appears in traces;
- provider mock runs without network.

## 9. `edk-db`

Purpose: SQL and database access with datasource-scoped actions, typed rows, and
safe query/execute boundaries.

Dependencies:

```text
edk-db -> std
```

Driver modules may later depend on `edk-http` for HTTP-based databases.

Source layout:

```text
packages/edk-db/src/edk/db/
  effects.es
  types.es
  errors.es
  sql.es
  pool.es
  transaction.es
  pure/sql_check.es
  pure/row_decode.es
  handlers/default.es
  handlers/read_only.es
  mocks/in_memory.es
  tools/query.es
  trace_specs/db_trace_specs.es
```

Public effect contract:

```text
effect EdkDb extends Network {
  action query(datasource: DatasourceRef, query: SqlQuery) -> QueryResult;
  action exec(datasource: DatasourceRef, command: SqlCommand) -> ExecResult;
}
```

Concrete action facts use the datasource identity.

Public types:

- `DatasourceRef`;
- `SqlQuery`;
- `SqlCommand`;
- `SqlParam`;
- `DbValue`;
- `Row`;
- `QueryResult`;
- `ExecResult`;
- `TransactionOptions`;
- `PoolOptions`.

Errors:

- `DbError`;
- `SqlSyntaxError`;
- `ConnectionError`;
- `TransactionError`;
- `ConstraintError`;
- `DecodeError`.

Implementation shape:

- `pure/sql_check.es` classifies read-only, mutation, transaction, and unknown
  queries;
- `query` and `exec` preserve datasource in action arguments;
- transaction APIs must preserve latent effects of the callback/body.

Public flows:

```text
query(ds, q) -> QueryResult
  ![EdkDb.query<ds>, Error<DbError>]

exec(ds, cmd) -> ExecResult
  ![EdkDb.exec<ds>, Error<DbError>]

transaction(ds, body) -> A
  ![body effects, Error<DbError>]
```

Tool layer:

- `query_readonly`;
- `explain_query`;
- `run_migration` only with explicit high-impact trace-spec conformance.

Tests:

- readonly trace spec accepts `query` and rejects `exec`;
- datasource parameters appear in effect rows;
- transaction body effects are preserved;
- in-memory mock supports deterministic query fixtures.

## 10. `edk-vector`

Purpose: vector search, vector writes, embedding generation, and retrieval helper
flows.

Dependencies:

```text
edk-vector -> edk-http -> std
```

The package must not rely on removed std actions such as `Agentic.embed`.

Source layout:

```text
packages/edk-vector/src/edk/vector/
  effects.es
  types.es
  errors.es
  store.es
  embed.es
  retrieve.es
  pure/similarity.es
  pure/chunking.es
  pure/filter_match.es
  handlers/default.es
  handlers/mock_embed.es
  mocks/store.es
  tools/retrieve.es
  trace_specs/vector_trace_specs.es
```

Public effect contract:

```text
effect EdkVector extends Network {
  action search(store: VectorStoreRef, query: VectorQuery) -> VectorSearchResult;
  action write(store: VectorStoreRef, records: Array<VectorRecord>) -> VectorWriteReceipt;
}

effect EdkEmbedding extends Agentic {
  action embed(model: EmbeddingModelRef, input: string) -> Embedding;
}
```

Embedding is package-defined. It is not `Agentic.infer` and not a std action.

Public types:

- `VectorStoreRef`;
- `EmbeddingModelRef`;
- `Embedding`;
- `VectorRecord`;
- `VectorQuery`;
- `VectorFilter`;
- `VectorSearchHit`;
- `VectorSearchResult`;
- `VectorWriteReceipt`;
- `ChunkingPolicy`.

Errors:

- `VectorError`;
- `EmbeddingError`;
- `StoreError`;
- `DimensionMismatchError`;
- `FilterError`.

Implementation shape:

- pure modules handle similarity, chunking, and filter matching;
- embedding provider flows use `edk-http` or future model substrate;
- store/search flows use datasource-specific handlers.

Public flows:

```text
embed(model, input) -> Embedding
  ![EdkEmbedding.embed, Error<EmbeddingError>]

search(store, query) -> VectorSearchResult
  ![EdkVector.search, Error<VectorError>]

upsert(store, records) -> VectorWriteReceipt
  ![EdkVector.write, Error<VectorError>]

retrieve(store, text, model) -> VectorSearchResult
  ![EdkEmbedding.embed, EdkVector.search, Error<VectorError>]
```

Tool layer:

- `retrieve_context`;
- `upsert_document_chunks`;
- `search_vectors`.

Tests:

- embedding effect is package-defined;
- store argument appears in search/write effect rows;
- pure similarity functions are deterministic;
- mock embed and mock store run retrieval offline.

## 11. `edk-algorithm`

Purpose: reusable deterministic algorithms for graph processing, search,
ranking, matching, scheduling, diffs, text utilities, and statistical helpers.
This package is a library package, not a host integration package.

Dependencies:

```text
edk-algorithm -> std
```

Source layout:

```text
packages/edk-algorithm/src/edk/algorithm/
  types.es
  errors.es
  graph.es
  search.es
  sort.es
  matching.es
  scheduling.es
  ranking.es
  diff.es
  text.es
  stats.es
  pure/priority_queue.es
  pure/disjoint_set.es
  pure/heap.es
  pure/matrix.es
  pure/string_match.es
  testsupport/generators.es
```

Public effect contract:

```text
No package-owned effect is required by default.
```

`edk-algorithm` should be pure unless an algorithm is parameterized by an
effectful callback. Callback effects must be preserved in the algorithm's
signature and summaries. The package must not hide effects from comparator,
scorer, expansion, predicate, or visitor functions.

Public types:

- `Graph<N, E>`;
- `DirectedGraph<N, E>`;
- `WeightedGraph<N, W>`;
- `NodeId`;
- `EdgeId`;
- `Path<N>`;
- `TopologicalOrder<N>`;
- `Scc<N>`;
- `SearchFrontier<N>`;
- `SearchResult<N>`;
- `Schedule<T>`;
- `Dependency<T>`;
- `Ranked<T, S>`;
- `MatchResult<L, R>`;
- `Diff<T>`;
- `EditScript<T>`;
- `StatsSummary`.

Errors:

- `AlgorithmError`;
- `CycleError`;
- `NoPathError`;
- `InvalidGraphError`;
- `InvalidWeightError`;
- `SearchLimitError`;
- `ScheduleConflictError`;
- `DimensionError`.

Implementation shape:

- graph algorithms should use stable deterministic ordering when multiple valid
  outputs exist;
- sorting/ranking must define tie-breaking explicitly;
- weighted algorithms must reject invalid weights instead of silently accepting
  NaN, negative weights where unsupported, or overflow-prone values;
- search algorithms must expose explicit limits to prevent unbounded exploration;
- callback-based algorithms must preserve latent effects.

Representative public flows:

```text
toposort(graph) -> TopologicalOrder<N>
  ![Error<CycleError>]

scc(graph) -> Array<Scc<N>>

shortest_path(graph, start, goal) -> Path<N>
  ![Error<NoPathError>, Error<InvalidWeightError>]

a_star(start, goal, neighbors, heuristic) -> SearchResult<N>
  ![neighbors effects, heuristic effects, Error<SearchLimitError>]

rank(items, score) -> Array<Ranked<T, S>>
  ![score effects]

stable_sort_by(items, compare) -> Array<T>
  ![compare effects]

maximum_matching(left, right, edges) -> MatchResult<L, R>

diff(old, new) -> EditScript<T>
```

Tool layer:

No default model-callable tools are required. Algorithm flows may be used by
other tools, but exposing generic algorithm tools to an agent should be an
application decision.

Tests:

- deterministic tie-breaking for topological sort, ranking, matching, and diff;
- cycle and no-path diagnostics;
- callback effects are preserved in golden effect summaries;
- explicit search limits reject unbounded exploration;
- property-style fixtures for graph invariants once the test framework supports
  generated data.

## 12. `edk-browser`

Purpose: browser automation with domain/session-scoped authority, deterministic
planning, and visible high-impact UI interactions.

Dependencies:

```text
edk-browser -> edk-http -> std
```

Browser control may use WebDriver/CDP over HTTP/WebSocket. Missing WebSocket or
browser-session substrate must be recorded as a substrate gap.

Source layout:

```text
packages/edk-browser/src/edk/browser/
  effects.es
  types.es
  errors.es
  page.es
  session.es
  selector.es
  pure/selector_parse.es
  pure/dom_snapshot.es
  handlers/default.es
  handlers/recording.es
  mocks/browser.es
  tools/page.es
  trace_specs/browser_trace_specs.es
```

Public effect contract:

```text
effect EdkBrowser extends Network {
  action create(profile: BrowserProfileRef, origin: Url) -> BrowserSessionRef;
  action attach(profile: BrowserProfileRef, origin: Url) -> BrowserSessionRef;
  action navigate<S ~ BrowserSession>(session: S, url: Url) -> PageSnapshot;
  action click<S ~ BrowserSession, P ~ ParsedSelector>(session: S, selector: P) -> PageSnapshot;
  action read<S ~ BrowserSession>(session: S) -> PageSnapshot;
}
```

The concrete `url.host` remains the trace-spec/runtime trace scope for navigation. The
session and selector parameters are evidence values: `BrowserSessionRef` is
runtime-produced, and `Selector` is produced by checked selector constructors.

Public types:

- `BrowserSessionRef`;
- `MockBrowserSessionRef`;
- `BrowserSession`;
- `BrowserProfileRef`;
- `Url`;
- `Selector`;
- `SelectorSpec`;
- `ParsedSelector`;
- `PageSnapshot`;
- `DomNode`;
- `ClickOptions`;
- `NavigationOptions`;
- `ScreenshotRef`.

Errors:

- `BrowserError`;
- `NavigationError`;
- `SelectorError`;
- `TimeoutError`;
- `SessionError`.

Implementation shape:

- pure modules parse selectors and summarize DOM snapshots;
- package implementation handlers talk to browser protocol substrate or a
  WebDriver/CDP endpoint through `std.browser.protocol` or through public
  lower-level `edk-http` / `std.stream` / `std.net.tcp` / `std.tls` substrate;
- clicks that submit forms or mutate authenticated sessions are high-impact.

Public flows:

```text
navigate(session, url) -> PageSnapshot
  ![EdkBrowser.navigate, Error<BrowserError>]

click(session, selector) -> PageSnapshot
  ![EdkBrowser.click, Error<BrowserError>]

read(session) -> PageSnapshot
  ![EdkBrowser.read, Error<BrowserError>]
```

Tool layer:

- `open_page`;
- `click_selector`;
- `read_page`.

Tests:

- domain-scoped policies;
- selector parse errors;
- recording handler golden traces;
- deterministic mock browser snapshots.

## 13. `edk-git`

Purpose: repository status, diff, patch, and commit helpers around
repository-scoped authority.

Dependencies:

```text
edk-git -> edk-workspace -> std
```

The default implementation may use `Command.run<GitSandbox>` if pure Git
implementation is not yet practical. That must remain explicit and
trace-spec-visible.

Source layout:

```text
packages/edk-git/src/edk/git/
  effects.es
  types.es
  errors.es
  repo.es
  diff.es
  patch.es
  commit.es
  pure/diff_parse.es
  pure/patch_validate.es
  handlers/default.es
  handlers/dry_run.es
  mocks/repo.es
  tools/repo.es
  trace_specs/git_trace_specs.es
```

Public effect contract:

```text
effect EdkGit extends FileIO {
  action read(repo: GitRepoRef) -> GitReadResult;
  action write(repo: GitRepoRef, change: GitChange) -> GitWriteReceipt;
}
```

`R` is the repository identity or path scope.

Public types:

- `GitRepoRef`;
- `GitStatus`;
- `GitDiff`;
- `Patch`;
- `CommitMessage`;
- `CommitReceipt`;
- `BranchRef`;
- `RemoteRef`;
- `GitChange`.

Errors:

- `GitError`;
- `PatchError`;
- `ConflictError`;
- `CommandError`;
- `RepositoryError`.

Implementation shape:

- pure modules parse diffs and validate patches;
- read flows prefer file/substrate access;
- write flows are high-impact;
- command-based fallback must use explicit `Command.run<GitSandbox>`.

Public flows:

```text
status(repo) -> GitStatus
  ![EdkGit.read, Error<GitError>]

diff(repo) -> GitDiff
  ![EdkGit.read, Error<GitError>]

apply_patch(repo, patch) -> GitWriteReceipt
  ![EdkGit.write, Error<GitError>]

commit(repo, message) -> CommitReceipt
  ![EdkGit.write, Command.run<GitSandbox>, Error<GitError>]
```

Tool layer:

- `repo_status`;
- `show_diff`;
- `apply_patch`;
- `commit_changes`.

Tests:

- write operations require trace-spec conformance/approval in examples;
- patch validator rejects path escape;
- dry-run handler removes write side effects;
- command sandbox appears in summaries when used.

## 14. `edk-github`

Purpose: GitHub API wrappers for issues, pull requests, reviews, and repository
metadata.

Dependencies:

```text
edk-github -> edk-http
edk-github -> edk-git
edk-github -> std
```

Source layout:

```text
packages/edk-github/src/edk/github/
  effects.es
  types.es
  errors.es
  auth.es
  issue.es
  pr.es
  repo.es
  pure/rest_encode.es
  pure/webhook_verify.es
  handlers/default.es
  handlers/dry_run.es
  mocks/api.es
  tools/issues.es
  tools/prs.es
  trace_specs/github_trace_specs.es
```

Public effect contract:

```text
effect EdkGitHub extends Network {
  action issue_create<R ~ GitHubTarget>(repo: R, draft: IssueDraft) -> IssueRef<R>;
  action pr_comment<R ~ GitHubTarget, P ~ GitHubPullRequestTarget<R>, C ~ GitHubReviewPath>(repo: R, pr: P, comment: ReviewComment<C>) -> CommentRef;
  action read<R ~ GitHubTarget>(repo: R, query: GitHubQuery<GitHubRestPath>) -> GitHubResult<R>;
}
```

`R` is checked repository evidence. Pull request, branch, review path, review
comment, and REST path values carry their own nominal evidence so raw ref/path
strings cannot reach the action boundary.

Public types:

- `GitHubRepoRef`;
- `GitHubRepoSpec`;
- `GitHubTarget`;
- `GitHubTokenRef`;
- `IssueDraft`;
- `IssueRef<R ~ GitHubTarget>`;
- `BranchRef`;
- `GitHubBranchRef`;
- `PullRequestRef<R ~ GitHubTarget, H ~ GitHubBranchRef, B ~ GitHubBranchRef>`;
- `GitHubPullRequestTarget<R>`;
- `CommentRef`;
- `GitHubQuery<P ~ GitHubRestRoute>`;
- `GitHubResult<R ~ GitHubTarget>`;
- `GitHubRestPath`;
- `ReviewPath`;
- `ReviewComment<P ~ GitHubReviewPath>`;
- `RateLimitState`.

Errors:

- `GitHubError`;
- `AuthError`;
- `RateLimitError`;
- `ApiError`;
- `WebhookError`.

Implementation shape:

- package implementation handlers use `edk-http`;
- authentication reads tokens through `std.secret.read(token)`, which records
  `Secret.read<token>`;
- webhook verification uses `std.crypto.hmac_sha256<K>` over opaque
  `SecretValue<K>`, which records `Secret.use<K>`, plus pure helpers such as
  `constant_time_eq` over byte-preserving request bodies;
- issue creation and comments are non-idempotent and require replay metadata.

Public flows:

```text
create_issue(repo, draft) -> IssueRef
  ![EdkGitHub.issue_create<R>, Secret.read<_>, Error<GitHubError>]

comment_pr(repo, pr, comment) -> CommentRef
  ![EdkGitHub.pr_comment<R>, Secret.read<_>, Error<GitHubError>]

get_pr(repo, pr) -> GitHubResult
  ![EdkGitHub.read<R>, Secret.read<_>, Error<GitHubError>]
```

Tool layer:

- `create_issue`;
- `comment_on_pr`;
- `read_pr`.

Tests:

- secret reads are visible;
- repo-scoped policies;
- mock API supports deterministic fixtures;
- non-idempotent actions have replay metadata.

## 15. `edk-pdf`

Purpose: PDF text extraction, page rendering metadata, and citation-friendly
document structure.

Dependencies:

```text
edk-pdf -> edk-workspace -> std
```

Source layout:

```text
packages/edk-pdf/src/edk/pdf/
  effects.es
  types.es
  errors.es
  extract.es
  render.es
  citation.es
  pure/pdf_parse.es
  pure/text_layout.es
  pure/citation_map.es
  handlers/default.es
  mocks/pdf.es
  tools/pdf.es
  trace_specs/pdf_trace_specs.es
```

Public effect contract:

```text
effect EdkPdf extends FileIO {
  action read(path: WorkspaceRootPath) -> PdfDocument;
}
```

`P` is the document path or path scope.

Public types:

- `PdfDocument`;
- `PdfPage`;
- `PdfTextSpan`;
- `PdfImageRef`;
- `PdfOutline`;
- `PdfMetadata`;
- `CitationRef`;
- `PageRenderOptions`;
- `PageRenderResult`.

Errors:

- `PdfError`;
- `PdfParseError`;
- `EncryptedPdfError`;
- `UnsupportedPdfError`;
- `RenderError`;
- `CitationError`.

Implementation shape:

- pure parsing is preferred where feasible;
- reading bytes goes through `edk-workspace`;
- rendering may need substrate gaps for fonts/images/PDF graphics.

Public flows:

```text
extract_text(path) -> PdfDocument
  ![EdkPdf.read, EdkWorkspace.read<R>, Error<PdfError>]

render_page(path, page, options) -> PageRenderResult
  ![EdkPdf.read, EdkWorkspace.read<R>, Error<PdfError>]

citations(path) -> Array<CitationRef>
  ![EdkPdf.read, EdkWorkspace.read<R>, Error<PdfError>]
```

Tool layer:

- `extract_pdf_text`;
- `render_pdf_page`;
- `pdf_citations`.

PDF outputs should be `Untrusted<...>` unless validated.

Tests:

- encrypted/unsupported PDF errors;
- path-scoped effects;
- citation maps are deterministic;
- mock PDF fixtures run without native tooling.

## 16. `edk-docs`

Purpose: structured document helpers and conversions across Markdown, HTML,
DOCX-like models, PDF-derived text, and plain text.

Dependencies:

```text
edk-docs -> edk-pdf
edk-docs -> edk-workspace
edk-docs -> std
```

Source layout:

```text
packages/edk-docs/src/edk/docs/
  effects.es
  types.es
  errors.es
  markdown.es
  html.es
  docx.es
  convert.es
  pure/markdown_parse.es
  pure/html_sanitize.es
  pure/doc_model.es
  handlers/default.es
  mocks/docs.es
  tools/convert.es
  trace_specs/docs_trace_specs.es
```

Public effect contract:

```text
effect EdkDocs extends FileIO {
  action convert(input: DocumentInput, target: DocumentFormat) -> DocumentOutput;
}
```

`F` is the input or output format/scope when useful for trace specs.

Public types:

- `DocumentFormat`;
- `DocumentInput`;
- `DocumentOutput`;
- `DocumentAst`;
- `MarkdownDocument`;
- `HtmlDocument`;
- `DocxDocument`;
- `PlainTextDocument`;
- `ConversionOptions`;
- `SanitizationReport`.

Errors:

- `DocsError`;
- `ParseError`;
- `ConversionError`;
- `SanitizationError`;
- `UnsupportedFormatError`.

Implementation shape:

- pure modules parse and transform document ASTs;
- file reads/writes go through `edk-workspace`;
- PDF inputs go through `edk-pdf`.

Public flows:

```text
markdown_to_html(doc) -> HtmlDocument
  ![EdkDocs.convert<"markdown-html">, Error<DocsError>]

html_to_text(doc) -> PlainTextDocument
  ![EdkDocs.convert<"html-text">, Error<DocsError>]

convert_file(input, output, format) -> unit
  ![EdkWorkspace.read<input>, EdkWorkspace.write<output>, EdkDocs.convert, Error<DocsError>]
```

Tool layer:

- `convert_document`;
- `extract_markdown_summary`;
- `sanitize_html`.

Tests:

- untrusted HTML sanitization;
- file conversion effect rows;
- unsupported format errors;
- pure document AST conversions.

## 17. `edk-eval`

Purpose: evaluation harnesses, golden outputs, trace checks, and deterministic
test fixtures for agent systems and EDK packages.

Dependencies:

```text
edk-eval -> edk-workspace
edk-eval -> std
```

Source layout:

```text
packages/edk-eval/src/edk/eval/
  effects.es
  types.es
  errors.es
  golden.es
  trace.es
  assertions.es
  pure/diff.es
  pure/trace_match.es
  handlers/default.es
  mocks/eval_store.es
  tools/eval.es
  trace_specs/eval_trace_specs.es
```

Public effect contract:

```text
effect EdkEval extends FileIO {
  action read(suite: EvalSuiteRef) -> EvalFixture;
  action write(suite: EvalSuiteRef, result: EvalResult) -> EvalWriteReceipt;
}
```

`E` is the evaluation suite or artifact root.

Public types:

- `EvalSuiteRef`;
- `EvalCase`;
- `EvalFixture`;
- `EvalResult`;
- `GoldenOutput`;
- `GoldenTrace`;
- `TraceExpectation`;
- `AssertionResult`;
- `DiffReport`.

Errors:

- `EvalError`;
- `GoldenMismatchError`;
- `TraceMismatchError`;
- `FixtureError`;
- `AssertionError`.

Implementation shape:

- pure modules implement diffs and trace matching;
- file access goes through `edk-workspace`;
- assertion failures should produce stable diagnostics.

Public flows:

```text
read_fixture(suite, case) -> EvalFixture
  ![EdkEval.read, EdkWorkspace.read, Error<EvalError>]

compare_golden(case, output) -> AssertionResult
  ![Error<EvalError>]

write_result(suite, result) -> EvalWriteReceipt
  ![EdkEval.write, EdkWorkspace.write, Error<EvalError>]

match_trace(expected, actual) -> AssertionResult
  ![Error<EvalError>]
```

Tool layer:

- `run_eval_case`;
- `compare_golden`;
- `summarize_eval_result`.

Tests:

- mismatch diagnostics are stable;
- trace matcher catches order violations;
- write effects are trace-spec-visible;
- golden fixtures run through mock storage.

## 18. Cross-Package Test Matrix

EDK should maintain integration tests that prove package composition:

| Scenario | Packages | Required proof |
|---|---|---|
| Research assistant | `edk-web`, `edk-vector`, `edk-docs`, `edk-email` | untrusted content remains visible until sanitized |
| Report publisher | `edk-web`, `edk-workspace`, `edk-email` | approval required before send, write scope enforced |
| PR reviewer | `edk-git`, `edk-github`, `edk-workspace` | repo-scoped effects and idempotent comments |
| PDF ingestion | `edk-workspace`, `edk-pdf`, `edk-vector` | path read, PDF read, vector write all visible |
| Browser capture | `edk-browser`, `edk-docs`, `edk-workspace` | domain-scoped browser actions and file writes |
| Workflow planning | `edk-algorithm`, `edk-workspace`, `edk-github` | graph scheduling is pure while repository/API effects stay visible |
| Evaluation run | `edk-eval`, all packages under test | golden effects and traces checked |

## 19. Engineer Acceptance Checklist

When implementation starts, each package must satisfy:

- no public high-level bodyless host binding;
- all public flows/tools have explicit effect rows;
- user-facing APIs that provide default behavior apply package handlers
  explicitly in Etas source;
- every escaping public action is explicitly abstract and must be handled by the
  caller/application;
- all package implementation handlers are Etas code over public lower-level APIs;
- all missing substrate is recorded in `tests/std-requirements/substrate-gaps.md`;
- package metadata exposes tool schemas, determinism, trust, idempotency, and
  mock bindings, but not runtime fallback handler mappings;
- golden effects prove no action is hidden;
- golden traces prove handler order and trace-spec behavior;
- mocks run without real network, browser, email, DB, payment, or filesystem
  side effects beyond approved test workspace boundaries.

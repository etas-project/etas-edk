# EDK Architecture

## 1. Purpose

EDK is the official Etas tool-kit distribution. It provides common integration
packages without expanding the source language or the core standard library.

EDK is not a source-language feature:

- it adds no keywords;
- it adds no special import rules;
- it has no compiler-private privileges;
- it is consumed through normal package dependencies and normal imports;
- it is checked as ordinary Etas package code.

The architectural rule is:

```text
std = minimal language/runtime substrate
EDK = official reusable integration packages written in Etas
applications = domain-specific orchestration, trace-spec policy, and business logic
```

The accepted low-level standard substrate includes source APIs such as
`std.net.tcp`, `std.stream`, `std.tls`, `std.fs`, `std.http.codec`,
`std.codec.text`, `std.secret`, `std.crypto`, and `std.browser.protocol`.
These APIs are not high-level integrations. They are the public runtime
substrate that EDK package handlers and implementations may build on.
`std.http.codec` operates on std-owned `HttpWire*` types, and secret-backed
crypto records `Secret.use<K>` instead of revealing secret bytes to pure code.

## 2. Repository Boundary

This repository owns:

- public EDK package APIs;
- package manifests and package metadata contracts;
- Etas source implementations, once implemented;
- package handler values used explicitly by EDK public APIs;
- mock profiles for tests;
- trace-spec templates and examples;
- golden effect summaries and golden traces;
- substrate-gap records.

This repository must not own:

- compiler internals;
- frontend special cases;
- runtime-private host escape hatches;
- hardcoded standard-library effect/action expansion;
- package manager implementation;
- language SPEC files.

If a package cannot be implemented over public `std` substrate primitives, the
required low-level primitive must be recorded under `tests/std-requirements/` instead
of hidden behind a package-private host binding.

Accepted substrate action owners use uppercase names without a `Std` prefix:

```text
Net.tcp_connect[std.net.tcp.host, std.net.tcp.port]
Stream.read[std.stream.stream]
Stream.write[std.stream.stream]
Tls.handshake[std.tls.server_name]
Fs.read<workspace_root>
Fs.write<workspace_root>
Secret.read<key>
Secret.use<key>
Browser.attach<profile>
Browser.send<session>
Browser.recv<session>
Browser.screenshot<session>
```

EDK package actions remain package-owned and source-facing:

```text
EdkHttp.request
EdkWorkspace.write<R>
EdkBrowser.navigate
```

The EDK action is the public package authority boundary. If a public EDK API
provides default behavior, its source body must explicitly apply a package
handler with `with`; the lower-level `std` substrate actions are checked in that
handler implementation. If a EDK action escapes, it is intentionally delegated to
the caller or application handler. No package metadata fallback should silently
dispatch it.

## 2.1 Nominal Evidence And Spec Evidence

EDK uses nominal evidence values, spec evidence constraints, and checked
constructors together. These mechanisms have separate responsibilities:

```text
nominal type = evidence value that cannot be mixed with its raw representation
spec        = type-level capability or region fact about that evidence value
constructor  = only trusted entry point that validates and normalizes raw input
trace/effect = runtime authority, traceability, and observable action boundary
```

Transparent `alias` declarations are reserved for harmless abbreviations such as
primitive-shaped compatibility names. High-impact resources must use nominal
types whose values are produced by checked constructors, and public EDK APIs
must express the required capability as a spec constraint where the SPEC calls
for one. EDK source is written to the SPEC and architecture target; if the
current frontend cannot check that source yet, the gap is recorded under
`tests/blocked/` instead of weakening the EDK API shape.

For workspace paths, the intended model is region-indexed evidence:

```etas
type WorkspaceRoot;
type ReportsRoot;

spec WorkspaceRegion;
impl WorkspaceRoot ~ WorkspaceRegion;
impl ReportsRoot ~ WorkspaceRegion;

type WorkspacePath<R ~ WorkspaceRegion> = {
    value: string,
};

spec ReadablePath<R ~ WorkspaceRegion>;
spec WritablePath<R ~ WorkspaceRegion>;
spec ListablePath<R ~ WorkspaceRegion>;
```

`report_path(value)` validates that a runtime string is normalized and remains
under `reports/**`; only then may it produce `WorkspacePath<ReportsRoot>`.
Subsequent write APIs can require `WritablePath<ReportsRoot>`. The spec fact
does not prove a runtime string is safe by itself; only the checked constructor
produces the evidence value that can satisfy the API boundary.

The same rule applies to other EDK packages:

- HTTP URL values are parsed into nominal URL evidence before reaching the core
  request API; public-network and user-header capabilities are spec facts.
- Email addresses and SMTP endpoints are checked constructors, not trimmed
  strings.
- Browser sessions are runtime-produced opaque handles; mock constructors stay
  under `mocks/`.
- GitHub token refs, repo refs, branch refs, PR refs, and REST paths are nominal
  evidence values with package-owned constructors.

Public EDK APIs must not accept a bare `string` for high-impact resources.
Convenience APIs may accept raw strings only at the boundary, and must
immediately parse or validate them into nominal evidence types before calling
action-backed APIs. Mock-only constructors belong under `mocks/` and must not be
re-exported as production package APIs.

Implementation blockers in the current frontend or package manager do not
change the EDK design. EDK must keep the target source shape, avoid fake
overloads and runtime fallbacks, and record any check/run failure as a compiler
or package-manager blocker with a minimal reproducer.

## 2.2 HTTP Client Boundary

HTTP is deliberately split across `std` and EDK:

```text
std.net.tcp        = TCP runtime substrate
std.tls            = TLS runtime substrate
std.stream         = byte-stream runtime substrate
std.http.codec     = deterministic HTTP wire codec
edk.http           = user-facing HTTP package API
edk.http.client    = configured generic client API
```

There must be no high-level `std.http.request` client. `std` is the runtime
substrate that lets EDK implement higher-level integrations without compiler
privileges or private host bindings. A EDK HTTP implementation should be
ordinary Etas code shaped like:

```text
std.net.tcp.connect(host, port, options)
std.tls.connect(tcp, host, tls_config)
std.stream.write_all(tls, std.http.codec.encode_request(wire_request))
std.stream.read_until_limit(tls, body_limit, timeout)
std.http.codec.decode_response_head(raw_head)
```

The public action recorded for trace specs and runtime trace is
`EdkHttp.request`.
Method and host are runtime action payload fields, not action type arguments.
The EDK HTTP implementation handler may request lower-level substrate actions
such as
`Net.tcp_connect[std.net.tcp.host, std.net.tcp.port]`, `Tls.handshake[std.tls.server_name]`, `Stream.write[std.stream.stream]`,
and `Stream.read[std.stream.stream]`, but those are implementation facts of the handler,
not a reason to move the HTTP client into `std`.

This boundary is intentional because a real HTTP client owns policy-heavy
behavior: redirects, cookies, proxies, authentication headers, retries and
backoff, streaming bodies, compression, caching, connection pooling, TLS policy,
body limits, timeout and cancellation, trace/replay/idempotency metadata, and
SSRF protection. Those APIs are expected to evolve in EDK, while the low-level
runtime substrate remains small and stable.

Default project templates may import `edk.http.{request, get, post}` so users
experience HTTP as part of the official distribution. `edk.http.client` is for
configured client values and should not become a second execution namespace.
Generic convenience APIs such as `get` and `post` belong at the `edk.http`
package API layer, not in `edk.http.client`. Typed JSON conveniences remain
blocked until a real typed JSON layer exists. This convenience must not be
implemented by a compiler special case, `std.http.request`, or a package-private
host call.

## 3. Dependency Direction

```text
application package
  -> edk package
      -> lower-level edk package
          -> std substrate
              -> runtime/host implementation
```

EDK packages may depend on each other when the dependency is semantically lower
level. For example:

- `edk.web` may build on `edk.http`;
- provider-specific email modules may build on `edk.http` or `edk.email.smtp`;
- `edk.github` may build on `edk.http`, `edk.git`, and JSON helpers;
- `edk.docs` may build on `edk.pdf` when converting PDF-derived data.

The dependency direction must not invert. A lower-level package must not import a
higher-level workflow package.

## 4. Effect And Action Model

EDK effects are package-defined authority boundaries. They are not standard
library effects.

EDK action names should be package-owned and explicit:

```text
EdkHttp.request
EdkWeb.search
EdkWorkspace.read<R>
EdkWorkspace.write<R>
EdkEmail.send
EdkDb.query
EdkVector.search
EdkBrowser.navigate
EdkGitHub.issue_create<R>
```

EDK must not reintroduce raw capability strings. Authority must remain visible as
effect/action facts so frontend analysis, trace-spec checking, handler dispatch,
trace, replay, and deployment manifests see the same boundary.

## 5. Package API Shape

Each integration package should expose these layers when useful:

| Layer | Owned artifact | Purpose |
|---|---|---|
| Effect/action declarations | `EdkX.action<...>` | Static authority boundary |
| Package implementation handler | package exported handler value | Source-visible execution over public substrate, applied explicitly by public APIs |
| Flow wrapper | ordinary Etas flow | Ergonomic source API |
| Tool wrapper | ordinary Etas tool | Explicit model-callable API |
| Mock profile | package metadata and test bindings | Deterministic testing |
| Trace-spec templates | package examples | Safe default use |

Public flow/tool signatures, effect rows, action parameters, tool schemas,
default trust labels, determinism classes, idempotency metadata, and replay
behavior are compatibility surface.

## 6. Completeness Rule

Every public EDK flow or tool must eventually satisfy one of these conditions:

1. it has an Etas body checked like user code;
2. it is not EDK, but a low-level `std` substrate primitive.

Every user-facing EDK flow or tool that is meant to run by default must
eventually apply its package implementation handler explicitly in Etas source.
Every EDK action that escapes is intentionally abstract and must be handled by
the caller or application; otherwise execution reports an unhandled action.

This initial repository skeleton intentionally contains no implementation files.
Engineers should add implementation only after the corresponding package
contract, substrate requirements, mock plan, and golden tests are agreed.

## 7. Package Set

The first package set is:

| Package | Modules | Authority boundary |
|---|---|---|
| `edk-http` | `edk.http`, `edk.http.client`, `edk.http.json` | HTTP request/response |
| `edk-web` | `edk.web.search`, `edk.web.fetch`, `edk.web.crawl` | Search, fetch, crawl |
| `edk-workspace` | `edk.workspace.files`, `edk.workspace.path` | Project-local file access |
| `edk-email` | `edk.email.smtp`, `edk.email.provider` | Email send/read |
| `edk-db` | `edk.db.sql`, `edk.db.pool` | SQL/database access |
| `edk-vector` | `edk.vector.store`, `edk.vector.embed` | Vector retrieval and writes |
| `edk-algorithm` | `edk.algorithm.graph`, `edk.algorithm.search`, `edk.algorithm.scheduling`, `edk.algorithm.ranking` | Pure reusable algorithms |
| `edk-browser` | `edk.browser.page`, `edk.browser.session` | Browser automation |
| `edk-git` | `edk.git.repo`, `edk.git.diff` | Repository read/write helpers |
| `edk-github` | `edk.github.issue`, `edk.github.pr` | GitHub API wrappers |
| `edk-pdf` | `edk.pdf.extract`, `edk.pdf.render` | PDF reading/rendering |
| `edk-docs` | `edk.docs.markdown`, `edk.docs.html`, `edk.docs.docx` | Document conversion |
| `edk-eval` | `edk.eval.golden`, `edk.eval.trace` | Evaluation harnesses |

The code-level structure of each package is specified in
`package-implementation-design.md`.

## 8. Testing Architecture

EDK tests should cover source-level and runtime-level contracts:

- package graph and public metadata checks;
- type checks;
- effect summary checks;
- trace-spec acceptance/rejection examples;
- handler examples;
- golden traces;
- interpreter smoke tests;
- diagnostics for negative examples;
- substrate coverage checks.

Golden effect summaries are semantic contracts. Golden traces are runtime
behavior contracts.

## 9. Safety Defaults

EDK should be safe by default:

- external content should return `Untrusted<...>` unless explicitly sanitized;
- writes, sends, mutations, browser actions, payments, deployment, and command
  execution should be high-impact actions;
- high-impact actions should ship suggested trace-spec templates;
- non-idempotent operations should expose idempotency keys where applicable;
- path, account, host, repository, tenant, datasource, and collection scopes
  should be effect/action parameters when they matter for trace specs or runtime
  authority.

## 10. Initial Repository Status

This repository currently contains only:

- workspace skeleton;
- package directory skeleton;
- architecture documentation;
- substrate requirement tracking documents;
- test and example directory skeletons.

It deliberately contains no `.es` package implementation files.

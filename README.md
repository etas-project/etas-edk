# Etas Development Kit

Official, reusable Etas packages for building agent systems.

The Etas Development Kit (EDK) implements higher-level integrations and domain
models as ordinary Etas source packages. EDK code uses the same parser, type
and effect system, package metadata, interpreter, host boundaries, and runtime
authorization as user code. It receives no compiler-private privileges.

## Package Set

| Package | Responsibility |
|---|---|
| [`edk-algorithm`](packages/edk-algorithm/README.md) | Deterministic graph, search, sort, ranking, matching, diff, scheduling, and collection helpers |
| [`edk-http`](packages/edk-http/README.md) | Nominal HTTP evidence, request/response APIs, wire composition, transport handlers, and HTTP actions |
| [`edk-web`](packages/edk-web/README.md) | Web fetch/search workflows and public URL evidence |
| [`edk-workspace`](packages/edk-workspace/README.md) | Region-scoped workspace paths and checked file workflows |
| [`edk-email`](packages/edk-email/README.md) | Email evidence, messages, provider/SMTP plans, and send actions |
| [`edk-db`](packages/edk-db/README.md) | Database references, query/execute boundaries, and result helpers |
| [`edk-vector`](packages/edk-vector/README.md) | Embedding/vector records, chunking, indexing, and search workflows |
| [`edk-browser`](packages/edk-browser/README.md) | Browser sessions, URLs/selectors, navigation, reads, screenshots, and protocol actions |
| [`edk-git`](packages/edk-git/README.md) | Repository, branch, status, commit, and remote workflows |
| [`edk-github`](packages/edk-github/README.md) | GitHub repositories, REST paths, issues, pull requests, and reviews |
| [`edk-pdf`](packages/edk-pdf/README.md) | PDF evidence, extraction, rendering, and document actions |
| [`edk-docs`](packages/edk-docs/README.md) | Document evidence, conversion, extraction, and workspace composition |
| [`edk-eval`](packages/edk-eval/README.md) | Evaluation datasets, cases, scoring, and report workflows |

## Current Status

All listed packages have source implementations, but package check, package
run, and real host-backed success are different acceptance levels.

The repository's current package-mode status records these smoke packages as
checking and running:

- `edk-algorithm`;
- `edk-workspace`;
- `edk-http`;
- `edk-email`;
- `edk-vector`;
- `edk-web`.

Other packages remain blocked at documented compiler/package metadata, opaque
host-handle, imported-tool, or real-provider boundaries. `edk-browser`, for
example, can check its source surface while real execution still requires a
browser/Network host service. See [package status](tests/package-status.md) for
the command-level evidence and active blockers.

No blocked package may be marked complete by adding an empty handler, mock
production response, no-op adapter, private host binding, or structural type
fallback.

## Using an EDK Package

Declare a dependency in the application's `etas.toml`. During sibling
development, use a path dependency:

```toml
[dependencies]
edk_http = { path = "../etas-edk/packages/edk-http", import = "edk.http" }
```

Then resolve, prepare, check, and run through the normal CLI:

```bash
etas pkg update .
etas pkg prepare .
etas check --all .
etas run .
```

Package preparation does not grant host authority. A project using HTTP,
browser, workspace, email, database, model, or secret operations must select a
runtime profile that provides the required host adapters and grants.

## Design Rules

- EDK builds above `std`. Low-level TCP/TLS/stream and HTTP wire codecs belong
  to the runtime substrate; opinionated HTTP client behavior belongs in
  `edk-http`.
- Public APIs use nominal evidence plus specs to prevent unsafe raw values from
  crossing trusted boundaries.
- Transparent representation aliases use `alias`; `type` creates nominal
  identity.
- Effect rows contain static effects/action families and static selectors, not
  ordinary runtime values. Concrete arguments remain in action payloads and
  trace records.
- Package-owned actions remain visible to effect analysis, trace specs,
  runtime authorization, replay, and audit tooling.
- Production handlers decompose high-level EDK actions into checked lower-level
  actions. They do not silently consume behavior or call private host APIs.
- Pure helpers and explicit test mocks are deterministic. Production execution
  fails closed when substrate, authority, or a provider is unavailable.
- Package metadata must preserve nominal identities, specs, public signatures,
  effects, requested actions, handler contracts, and runtime-callable source
  requirements across package boundaries.

## HTTP Layering Example

Ordinary applications use the high-level API:

```etas
import edk.http.get;
import edk.http.client.defaults.default_options;
import edk.http.errors.HttpError;
import edk.http.policy.EdkHttp;
import edk.http.types.HttpResponse;

flow load(url: string) -> HttpResponse ![EdkHttp.request, Error<HttpError>]
{
    return get(url, default_options());
}
```

`edk-http` owns redirect, limits, headers, request/response evidence, error
mapping, and high-level `EdkHttp.request` semantics. Its handler may use
`std.net.tcp`, `std.tls`, `std.stream`, and `std.http.codec`; application code
should not need to assemble TCP and HTTP framing for ordinary requests.

Exact exported names and constructors are defined by the package README and
source. Examples must compile against the current package API before being
promoted to this root document.

## Repository Layout

```text
etas-edk/
  etas.toml             EDK workspace/package manifest
  packages/             one ordinary Etas package per domain
  tests/                positive, negative, smoke, blocked, and golden evidence
    std-requirements/   substrate requirements discovered by package work
  examples/             reserved cross-package application examples
  docs/architect/       EDK and package architecture
```

The current `examples/` document lists intended applications; those examples
must not be described as executable until their directories and acceptance
scripts exist.

## Development Workflow

With a current `etas` binary on `PATH`, a focused package cycle is:

```bash
etas pkg update packages/edk-http
etas pkg prepare packages/edk-http
etas check --all packages/edk-http
etas run packages/edk-http
```

Run package-specific verification when present. For HTTP:

```bash
bash tests/std-requirements/http/verify.sh
```

Generated `.etas/`, lockfiles produced only for local probes, loopback state,
and temporary runtime artifacts must not be mistaken for source. Do not edit
generated package metadata to make a test pass.

Before changing a public EDK API, update together:

- package source and exports;
- positive and negative fixtures;
- expected type/effect/action metadata;
- package smoke program;
- runtime or loopback evidence where applicable;
- package status and blocker documentation.

## Documents

- [Package index](packages/README.md)
- [Test strategy](tests/README.md)
- [Package status](tests/package-status.md)
- [Example applications](examples/README.md)
- [EDK architecture](docs/architect/edk-architecture.md)
- [Package layout](docs/architect/package-layout.md)
- [Package implementation design](docs/architect/package-implementation-design.md)
- [Known SPEC drift](docs/architect/edk-vs-spec-outdated-areas.md)
- [Standard substrate gaps](tests/std-requirements/substrate-gaps.md)

Normative language design lives in the main repository:

- [Official EDK packages](https://github.com/etas-project/etas/blob/main/docs/design/17-edk-official-packages.md)
- [Package management](https://github.com/etas-project/etas/blob/main/docs/design/15-package-management.md)
- [Effect system](https://github.com/etas-project/etas/blob/main/docs/design/06-effect-system-and-inference.md)

## License

Etas EDK is distributed under the terms of both the
[MIT License](LICENSE-MIT) and the
[Apache License (Version 2.0)](LICENSE-APACHE). You may choose either license.

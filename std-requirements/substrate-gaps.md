# Substrate Gaps

This file tracks unresolved implementation gaps for low-level `std` or runtime
substrate that EDK needs for source-level package handlers. Accepted substrate
design targets are recorded in `accepted-primitives.md`. Compiler,
package-manager, metadata, and frontend effect-summary gaps are tracked in
`tests/blocked/` instead of being treated as stdlib requirements.

EDK packages must not hide missing substrate behind package-private host
bindings, fake handlers, empty responses, no-op writes, or compatibility shims.

## Network Stream, TLS, And HTTP Codec

Packages: `edk-http`, `edk-web`, `edk-email`, `edk-browser`, `edk-github`

Accepted substrate with remaining implementation gaps:

- wildcard action-argument support for stream action rows such as
  `Stream.read<_>` and `Stream.write<_>`;
- runtime tests proving TCP/TLS/stream/codec behavior through EDK package
  handlers, including timeout and cancellation visibility to policy and replay.
- interpreter/package-runtime support for source handlers whose checked effect
  summaries preserve bottom `Tcp/Stream/Tls` actions, so no-network preflight
  branches can run without fake host adapters while real network branches still
  require configured host services.

Current probes confirm the EDK boundary: `TcpStream` and `TlsStream` can now be
used with `std.stream.write_all/flush/read_until_limit/close`, and source can
construct `HttpWireRequest` values with `version`, `List<HttpHeader>`, a
checked `Host` header, and a `bytes` body from `std.codec.text.utf8_encode`.
EDK HTTP now injects host authority, stores request bodies as raw `bytes`, and
derives request limits and method-specific `Content-Length` from those bytes.
The transport also returns response body bytes as authoritative
`ResponseBody.raw` independently of UTF-8 validity. `std.codec.text.Strict`,
`Replace`, `InvalidUtf8`, `std.codec.text.utf8_decode`,
`std.http.codec.MalformedMessage`, `std.http.codec.decode_response`,
`std.bytes.len`, and `std.result.is_ok/is_err` are now runtime-callable in the
HTTP requirements probes. EDK request helpers populate informational
`RequestBody.length_bytes`, while execution recomputes `std.bytes.len(raw)`.
Response compatibility text uses `Replace`; explicit strict decoding maps
`InvalidUtf8` to `HttpError` without discarding a successfully received raw
response.

`std.stream.StreamError.LimitExceeded` is now source-visible as a qualified
value path. Both the direct import fixture and the qualified-path fixture run,
and EDK HTTP uses that path to map `read_until_limit` overflow to
`response_body_limit`.

Full HTTP success requires explicit host authorization. `check_loopback_runtime_contract`
exercises real get/post, body-limit, and malformed-response paths without
mocks. Running without `--allow-net` fails closed with `TCP host adapter is not
configured`; running with explicit `--allow-effects --allow-net
127.0.0.1:<port>` reaches the loopback server and returns `0`.

Safety impact:

A package-private HTTP host binding would hide host/origin authority and make
network effects invisible to checked action facts. EDK source may expose
`EdkHttp.request` action boundaries and pure request/response helpers, but
user-facing APIs that provide default behavior must apply a real source handler
over public substrate and delegate HTTP IO to the source transport layer. They
must not publish fake network handlers, no-op responses, silently dropped
request bodies, or package-private host clients.

## Browser Protocol

Package: `edk-browser`

Accepted substrate with missing implementation:

- public browser-session creation or attachment;
- WebDriver/CDP/WebSocket command transport;
- page, DOM, screenshot, and navigation event handling;
- policy-visible session/origin binding.

Safety impact:

A hidden browser host call would obscure high-impact UI mutations and session
authority. Pure selector, URL, DOM-shape, and mock constructors remain valid,
but production browser execution remains blocked.

## Workspace Filesystem

Packages: `edk-workspace`, `edk-git`, `edk-pdf`, `edk-docs`, `edk-eval`

Accepted substrate with missing implementation:

- project-root-scoped read/list/stat/write primitives;
- atomic write support;
- canonical path resolution before filesystem access;
- a runtime path-escape guard that can reject before requesting host IO.

Safety impact:

Host-internal filesystem grants must not bypass EDK path/scope checks. Pure
path normalization and escape detection are implemented; runtime action
wrappers remain blocked until real typed-error raising and scoped action
metadata are available.

See `tests/blocked/edk-workspace-path-escape-runtime-guard.txt`.

## Bytes And Text Codecs

Packages: `edk-workspace`, `edk-http`, `edk-docs`, `edk-pdf`

Accepted substrate with missing implementation:

- deterministic byte/string encoding and decoding helpers;
- explicit charset and malformed-input behavior;
- typed errors or result values for codec failures.

Safety impact:

String-only file actions would hide binary/text conversion failures and confuse
policy/replay. EDK should keep byte-level workspace actions and pure text-shape
helpers until public codecs exist.

## JSON Codec And Typed JSON Values

Package: `edk-http`

Accepted substrate with missing implementation:

- deterministic JSON value representation;
- JSON encode/decode helpers;
- typed JSON codec errors that can map into `Error<HttpError>`;
- package metadata for public JSON value signatures.

Safety impact:

`post_json` must not hide JSON encoding inside a private HTTP host call or
pretend arbitrary strings are fully typed JSON values. Current source keeps a
JSON-text convenience wrapper and records the typed `JsonValue` signature as
blocked in `tests/blocked/edk-http-typed-json-codec.txt`.

## Secret, Crypto, And Webhook Verification

Packages: `edk-github`, `edk-email`, future signed-webhook integrations

Accepted substrate with missing implementation:

- package-visible secret key/value construction and import metadata;
- HMAC-SHA256;
- constant-time digest comparison;
- byte-preserving request body access for signature verification.

Safety impact:

Passing secrets as ordinary strings or hiding token reads inside opaque
handlers would make `Secret.read` authority invisible. Current GitHub source
uses `SecretKey<GitHubToken>` for token refs, keeps `Secret.read` in public
effect rows, and validates webhook header shape only; source-level token-key
materialization, full token read, and HMAC verification remain blocked.

See `tests/blocked/edk-github-secret-read.txt` and
`tests/blocked/edk-github-webhook-hmac.txt`.

## Replay And Idempotency Runtime Metadata

Packages: `edk-email`, `edk-github`, other non-idempotent integration packages

Missing runtime metadata:

- package action metadata for determinism and idempotency;
- replay-safe ordering and retry semantics;
- golden trace replay for package-owned actions without fake delivery handlers.

Safety impact:

An ordinary data field such as an idempotency key is not enough to prove
runtime replay safety. Non-idempotent action semantics must remain explicit in
runtime/package metadata before default send/create handlers are considered
complete.

See `tests/blocked/edk-email-send-replay-metadata.txt` and
`tests/blocked/edk-github-replay-metadata.txt`.

## Tracked Outside Std Requirements

These unresolved issues are real, but they are not std substrate requirements:

- package-defined action scope metadata:
  `tests/fixtures/negative/custom_action_scope_gap` and
  `tests/blocked/edk-frontend-tooling-gaps.txt`,
  `tests/blocked/edk-http-policy-templates.txt`;
- package-defined typed error raising:
  `tests/blocked/edk-db-query-readonly-runtime-guard.txt` and
  `tests/blocked/edk-workspace-path-escape-runtime-guard.txt`. EDK HTTP covers
  the public unsupported-method preflight path package-locally before
  transport;
- higher-order callback latent effects:
  `tests/blocked/callback-latent-effects.txt`;
- package metadata and local path dependency materialization:
  `tests/package-status.md`;
- handler and mock/dry-run trace metadata:
  `tests/blocked/edk-http-mock-dry-run-trace.txt`;
- CLI/workspace/front-end paper cuts:
  `tests/blocked/edk-frontend-tooling-gaps.txt`.

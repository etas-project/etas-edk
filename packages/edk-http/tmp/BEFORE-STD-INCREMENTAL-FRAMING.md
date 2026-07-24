# Work Before `std` Incremental HTTP Framing

## Purpose

This document defines the `edk-http` work that can be completed before `std`
adds incremental HTTP response-head and chunk-size-line prefix decoders.

The current interpreter already unwraps nominal record representations during
field access. The former `PublicHttpUrl` nominal field-access issue is therefore
not a current blocker for this work. Runtime tests should still use checked URL
construction and explicit network authorization.

## Next Agent Session Scope

The next implementation session should complete **Phase 1** of this document:

1. make raw request bytes authoritative for wire length and request limits;
2. define empty-body `Content-Length` behavior by HTTP method;
3. derive and validate request `Content-Type`;
4. make response bodies byte-first; and
5. update all affected package code, action payloads, examples, fixtures, tests,
   and documentation.

Sections 3 through 6 remain valid work that can be done before the `std`
framing changes, but they are not part of this first implementation unless the
user explicitly expands the scope. Redirect, retry, configured-client, and DNS
security details must not be invented during Phase 1.

All changes in Phase 1 belong to `packages/edk-http` and its EDK tests. No
`etas-core`, `std`, frontend, or interpreter changes are required.

## Fixed Phase 1 Decisions

These decisions are final for the next implementation session.

### `RequestBody.length_bytes`

Keep `RequestBody.length_bytes` for now to avoid a public shape change, but make
it informational and non-authoritative.

- Wire `Content-Length` must use `std.bytes.len(request.body.raw)`.
- Request body-limit checks must use `std.bytes.len(request.body.raw)`.
- Text and byte body constructors should still populate `length_bytes` with the
  correct byte count.
- A manually constructed incorrect `length_bytes` value must not affect wire
  framing or bypass a limit.
- Do not reject a request solely because informational `length_bytes` differs
  from `bytes.len(raw)`.

### Empty-body `Content-Length`

Use method-specific behavior:

- empty `POST`, `PUT`, and `PATCH` requests emit `Content-Length: 0`;
- empty `GET`, `HEAD`, and `DELETE` requests omit `Content-Length`; and
- every non-empty request emits the actual raw byte length.

Caller-provided `Content-Length` remains forbidden and is stripped during wire
lowering as defense in depth.

### Request `Content-Type`

Use this precedence:

1. preserve one valid checked caller-provided `Content-Type`;
2. otherwise, when `RequestBody.media_type` is non-empty, emit it even if the
   raw body is empty; and
3. otherwise omit `Content-Type`.

Header matching and duplicate prevention must be case-insensitive. Validate the
media type before transport at least strongly enough to reject empty/unsafe
control data and CR/LF header injection. Do not implement a new complete MIME
grammar parser as part of this work.

The default `empty()` body has an empty media type, so ordinary empty
`GET`/`HEAD`/`DELETE` requests do not gain a `Content-Type` header.

### Byte-first `ResponseBody`

Keep the stored `text` field in `ResponseBody` to preserve the existing public
shape, but make it a non-authoritative compatibility projection. The
authoritative response representation is `raw`; package-created response bodies
must populate `text` by lossy UTF-8 replacement decoding of `raw`:

```text
ResponseBody {
    media_type,
    raw,
    text,
}
```

Receiving an HTTP response must not require strict UTF-8 decoding. New code that
needs a defined text-decoding policy should use explicit helpers rather than
relying on the compatibility field. Provide:

- `decode_text_strict(body: ResponseBody) -> Result<string, HttpError>`, mapping
  invalid UTF-8 to the existing codec error model; and
- `decode_text_lossy(body: ResponseBody) -> string`, using replacement decoding
  only when callers explicitly choose that behavior.

Place these helpers under `edk.http.body` unless the existing module layout
requires a dedicated response decoding module. Both helpers must decode `raw`
and must not trust the stored `text` field. Keep existing response-body
constructor names and signatures when possible.

Existing action payload `body_text` fields may remain for API compatibility.
`body_raw` is authoritative: lowering derives `body_text` lossily from raw bytes,
and raising reconstructs the compatibility text from `body_raw` rather than
trusting a conflicting supplied `body_text` value.

Invalid UTF-8 must not discard a valid response status, headers, or raw body.
Compressed bytes must remain raw until a separate decompression feature exists.
The compatibility `text` projection of compressed raw bytes has no content
semantics and must not be treated as decompression or charset interpretation.

## Current Transport Boundary

The current transport sends `Connection: close` and uses
`std.stream.read_until_limit(...)`, which reads until EOF or a total byte limit.
Within that boundary, `edk-http` can provide a correct bounded
connection-close client. It cannot yet complete framed keep-alive responses
without waiting for EOF.

The current `BodyLimit` is applied to the complete buffered response, including
the status line and headers. Until incremental framing is available, document
this as a total response-buffer limit rather than an exact body-only limit.

## 1. Request Wire Correctness

### Authoritative body length

- Compute request `Content-Length` from
  `std.bytes.len(request.body.raw)` at wire lowering time.
- Apply request body limits to the same raw byte length.
- Do not trust caller-provided `RequestBody.length_bytes` as authoritative.
- Keep `length_bytes` as informational metadata in this phase.
- Emit `Content-Length: 0` for empty `POST`, `PUT`, and `PATCH` requests; omit
  it for empty `GET`, `HEAD`, and `DELETE` requests.

Acceptance criteria:

- `你好` produces `Content-Length: 6`.
- Emoji and binary body lengths match their encoded bytes.
- A manually forged `length_bytes` cannot alter framing or bypass a body limit.

### Automatic Content-Type

- Derive `Content-Type` from a non-empty `RequestBody.media_type` when the caller
  did not provide it, regardless of whether the raw body is empty.
- Preserve one checked explicit override.
- Validate media types before wire lowering so CR/LF cannot inject headers.
- Prevent duplicates case-insensitively.
- Emit the header for an empty body when its media type is non-empty.

Acceptance criteria:

- `text("application/json", "{}")` emits exactly one matching header.
- A checked explicit override wins and still emits exactly one header.
- Unsafe media types fail before network access.

### Header normalization

- Normalize names consistently in `set`, `find`, duplicate replacement,
  managed-header checks, preflight, and wire lowering.
- Treat request and response header names as case-insensitive.
- Retain defense-in-depth stripping of caller-provided `Host`,
  `Content-Length`, and `Connection` during wire lowering.

## 2. Byte-First Responses

- Preserve `HttpResponse.body.raw` for arbitrary response bytes.
- Do not reject an otherwise valid response because its body is invalid UTF-8.
- Keep `ResponseBody.text` as a lossy compatibility projection, make
  `ResponseBody.raw` authoritative, and provide explicit strict and lossy text
  decoding helpers that decode `raw`.
- Resolve response `Content-Type` case-insensitively.
- Do not interpret compressed bytes as text before decompression is supported.

This work is valid for responses that the current connection-close transport
can buffer completely. It does not solve incremental response framing.

Acceptance criteria:

- The bytes `ff fe fd` are returned unchanged in `ResponseBody.raw`.
- Invalid UTF-8 is not reported as an HTTP codec failure.
- Strict decoding distinguishes `Ok("")` from a decoding error.

## Phase 1 Expected Files

At minimum, inspect and update the following files as required:

```text
packages/edk-http/src/edk/http/types.es
packages/edk-http/src/edk/http/body/mod.es
packages/edk-http/src/edk/http/body/text.es
packages/edk-http/src/edk/http/body/bytes.es
packages/edk-http/src/edk/http/wire/lower_request.es
packages/edk-http/src/edk/http/wire/body_limit.es
packages/edk-http/src/edk/http/wire/decode_response.es
packages/edk-http/src/edk/http/transport.es
packages/edk-http/src/edk/http/headers/build.es
packages/edk-http/src/edk/http/headers/mod.es
packages/edk-http/src/edk/http/handlers/preflight.es
packages/edk-http/src/edk/http/action_payload.es
packages/edk-http/src/edk/http/package_smoke.es
```

Also search the complete repository for `RequestBody {`, `ResponseBody {`,
`.length_bytes`, and response text conversions. Update examples, action payload
conversions, positive/negative fixtures, lockfiles only when source/package
changes require it, and documentation that treats response text as authoritative.
Existing `.body.text` call sites may remain as compatibility consumers; Phase 1
does not require migrating `edk-web`.

## Phase 1 Required Tests

Add or promote deterministic tests for:

- ASCII, Chinese, emoji, empty, and binary request lengths;
- forged `length_bytes` not affecting wire output or request limits;
- method-specific empty-body `Content-Length` behavior;
- automatic `Content-Type`, explicit override, empty typed body, invalid media
  type, and case-insensitive duplicate prevention;
- arbitrary invalid UTF-8 response bytes retained unchanged;
- valid UTF-8, empty bytes, NUL-containing bytes, strict decode failure, and
  lossy decode behavior;
- case-insensitive response `Content-Type` lookup; and
- existing managed-header rejection and action payload round trips.

Verification should include the repository's existing `edk-http` package check,
package smoke, HTTP requirement verifier, and focused fixtures that do not need
the unavailable incremental framing APIs. Do not make a known framing target
pass by weakening it or by adding package-local protocol parsing.

## Phase 1 Definition of Done

- Wire request length and request limits are derived only from raw bytes.
- Informational `length_bytes` cannot alter behavior.
- Empty-body `Content-Length` follows the fixed method table above.
- `Content-Type` follows the fixed precedence above and cannot inject headers.
- Response receipt is independent of UTF-8 validity.
- `ResponseBody.raw` is authoritative; stored `text` is derived lossily for
  compatibility and cannot affect response receipt or strict decoding.
- Strict and lossy helpers decode `raw`, and affected package tests cover both
  helpers without requiring compatibility call sites to migrate immediately.
- Existing non-framing checks remain green.
- No `std`, interpreter, frontend, or package-local HTTP framing parser changes
  are introduced.

## 3. Existing Stream Error Semantics

Use the error variants already exposed by `std.stream`:

- map `TimedOut` to a stable `kind = "timeout"`;
- distinguish `Cancelled`, `Closed`, `Interrupted`, `LimitExceeded`, and host
  failures where they are reported;
- record the failing phase, such as write, flush, response read, or close;
- keep codec, network, TLS, stream, timeout, and limit errors distinct; and
- do not replace a successfully received response with a close error when the
  connection is not reused.

Precise DNS, connect, TLS-handshake, write, body-idle, and total-deadline
coverage may require additional substrate support. That does not block exact
classification of errors already exposed by `std.stream`.

## 4. Stable Public Execution API

- Export one root `request(HttpRequest)` entry point.
- Route `get`, `post`, `put`, `patch`, `delete`, and `head` through that path.
- Preserve checked caller headers and managed-header restrictions.
- Keep `edk.http.transport` out of the long-term public API.
- Add `client.request(client, request)` without creating a second execution
  path.
- Apply configuration that actually affects execution.
- Reject active proxy, authentication, cookie, TLS, or other unsupported
  settings explicitly rather than silently ignoring them.

Acceptance criteria:

- An external package can set a checked `Authorization` header and call the
  stable root executor.
- Root helpers and configured clients share the same preflight and transport
  path.
- No documented active configuration is silently ignored.

## 5. Redirect and Retry Over Connection-Close Transport

Basic orchestration can be implemented without connection reuse.

Redirect requirements:

- honor `follow` and `max_hops`;
- resolve supported relative and absolute `Location` values;
- define 301/302/303 method rewriting;
- preserve method and body for 307/308;
- reject missing or invalid locations and redirect loops;
- strip sensitive headers on cross-origin redirects; and
- repeat URL checks, preflight, and network authorization for every hop.

Retry requirements:

- interpret `max_attempts` as total attempts;
- initially retry only safe, replayable methods and bodies;
- retry only selected transient failures and statuses;
- do not retry an unsafe request after an ambiguous partial write by default;
- keep retry attempts separate from redirect hops; and
- use bounded fixed backoff where current clock support permits it.

Strict total-deadline accounting, jitter, and complete `Retry-After` support can
remain follow-up work if the required time primitives are unavailable.

## 6. Public Target Security

- Stop exporting unchecked `public_http_url_evidence(...)` to external
  packages.
- Require public targets to originate from checked constructors.
- Keep explicitly authorized internal targets separate from public URL
  evidence.
- Add expected-negative external-package tests proving that private and
  loopback URLs cannot be relabeled as public values.

Text-level evidence sealing is EDK work and can proceed now. Validating DNS
results and binding the approved address to the subsequent connection cannot be
claimed complete while the transport connects by hostname without a
resolver/validated-address API.

## Recommended Delivery Order

1. Fix raw-byte request length, body limits, and automatic `Content-Type`.
2. Normalize header handling and add pure wire regression tests.
3. Make responses byte-first and improve current error mapping.
4. Export the stable request executor and add configured-client execution.
5. Seal unchecked public URL evidence.
6. Add safe basic redirect orchestration.
7. Add bounded safe retry orchestration.
8. Promote each blocked target only after its behavior is deterministic.

## Explicitly Deferred Until `std` Changes

Do not implement package-local HTTP grammar scanning as a workaround. Defer:

- response-head prefix parsing with exact consumed-byte counts;
- incomplete-versus-malformed prefix classification;
- chunk-size-line grammar parsing;
- framed keep-alive completion;
- exact fixed-length and chunked truncation detection;
- independent response-head and response-body limits;
- over-read preservation for connection reuse; and
- pooling, pipelining, or streaming response APIs.

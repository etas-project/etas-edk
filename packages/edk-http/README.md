# edk-http

Current source modules follow the architecture split between the root HTTP
facade, public HTTP API, configured request construction, pure helpers, wire
lowering/decoding, transport composition, mocks, and package implementation
handlers.

Primary public API:

- `edk.http.get(url: string, options)`
- `edk.http.post(url: string, body, options)`
- `edk.http.put(url: string, body, options)`
- `edk.http.patch(url: string, body, options)`
- `edk.http.delete(url: string, options)`
- `edk.http.head(url: string, options)`
- `edk.http.get_url(url: PublicHttpUrl, options)`
- `edk.http.post_url(url: PublicHttpUrl, body, options)`

Generic configured client helpers:

- `edk.http.client.new`

`edk.http.client` intentionally does not expose an alternate request execution
entry point or method-specific convenience wrappers. `edk-http` also does not
expose `post_json`, `fetch_text`, `fetch_json`, or `submit_json`; the first
layer is generic HTTP only. Callers build a `RequestBody` explicitly and choose
their media type.

Implemented source layout:

- `edk.http`
- `edk.http.api`
- `edk.http.policy`
- `edk.http.types`
- `edk.http.errors`
- `edk.http.client`
- `edk.http.client.config`
- `edk.http.client.defaults`
- `edk.http.body`
- `edk.http.body.bytes`
- `edk.http.body.text`
- `edk.http.url`
- `edk.http.url.parse`
- `edk.http.url.normalize`
- `edk.http.url.validate`
- `edk.http.url.scope`
- `edk.http.headers`
- `edk.http.headers.validate`
- `edk.http.headers.build`
- `edk.http.wire.lower_request`
- `edk.http.wire.decode_response`
- `edk.http.wire.body_limit`
- `edk.http.transport`
- `edk.http.pure.method`
- `edk.http.pure.status`
- `edk.http.pure.redirect`
- `edk.http.pure.retry_plan`
- `edk.http.pure.ssrf`
- `edk.http.mocks.server`
- `edk.http.mocks.routes`
- `edk.http.mocks.responses`
- `edk.http.handlers.default`
- `edk.http.package_api_contract`

The checked action family is `EdkHttp.request`. Public root APIs
apply the source transport handler internally, so `EdkHttp.request` remains
in requested-action and trace facts but must not escape from ordinary
user-facing HTTP calls. Direct user-written `perform EdkHttp.request(...)` is
the advanced extension point; without an explicit handler it must fail as an
unhandled action.
`edk.http.api` wrappers parse absolute URL strings into `PublicHttpUrl`
evidence, construct checked `HttpMethod` evidence, construct `HttpRequest`
values, and execute through the package transport path. The root `edk.http`
module is a compatibility facade over that API module. Parse failures are
raised as `HttpError.invalid_url` before transport. Public URL constructors
such as `https(...)`, `http(...)`, and `url_with_port(...)` now return
`Result<PublicHttpUrl, HttpError>`; they are checked constructors, not raw
`Url` builders. Public method construction flows through `http_method(...)` or
fixed constructors such as `get_method()` / `post_method()`. Configured request
builders such as `default_request`, `request_with_options`, and
`request_with_body_options` consume `HttpMethod` plus `PublicHttpUrl` evidence.
The source follows the target action family contract: method and host stay in
the runtime action payload and policy/trace metadata, not in action type
arguments. Reusable exported policy templates over method/host payload values
remain a package metadata and runtime policy blocker.

`edk.http.package_api_contract` is a package-local source contract used by
`etas check --all .` and `etas effects`: it type/effect-checks
`request/get/post/put/patch/delete/head` calls and separately verifies that POST
request construction preserves the supplied body and caller-provided
timeout/body-limit/retry/redirect options. It is not a runtime fallback or an
extra public API.

`edk.http.package_smoke` and `tests/fixtures/positive/edk_http_pure_surface`
unwrap checked header/request construction by raising `HttpError` on failure;
they do not substitute empty headers or default requests when a checked
constructor fails.

URL parsing and host validation are syntactic and do not expose `IndexError` to
root HTTP callers. `parse_url(...)` remains a raw syntactic parser for pure
validation tests, but `parse_public_url(...)` and public URL constructors reject
private/reserved hosts and only produce `PublicHttpUrl` after validation.
Loopback/internal endpoints require separate host/runtime binding metadata, not
an unchecked `PublicHttpUrl`. Absolute URL parsing preserves explicit
`host:port` authority in `Url.port`, applies `80`/`443` defaults for HTTP/HTTPS,
and rejects missing, non-numeric, or out-of-range ports before transport.

`EdkHttpTransportDefault` is now a source-level handler value, with
`EdkHttpDefault` kept as the default-handler layout alias. Request constructors
apply default or caller-provided timeout, body-limit, retry, and redirect
settings; the root `request(req)` path normalizes checked method evidence and preserves
those request fields before the handler runs. The handler delegates to private
transport execution, which performs shared preflight validation, rejects
body-limit overflow before network access, preserves private/reserved host
access for local test servers while leaving those hosts source-classified for
future policy metadata, encodes the wire request head
through `std.http.codec`, opens TCP through `std.net.tcp`, and upgrades HTTPS
through `std.tls`. It is not a private host HTTP client and not a package
metadata fallback.

Request headers and request bodies are source-visible: EDK injects `Host`,
forwards caller headers as `List<HttpHeader>`, stores both text and raw bytes
on request/response bodies, and lowers `RequestBody.raw` into the
`HttpWireRequest` `bytes` body. `RequestBody.length_bytes` remains in the public
shape as informational metadata, but request preflight limits and wire
`Content-Length` derive exclusively from `std.bytes.len(RequestBody.raw)`.
Empty `POST`/`PUT`/`PATCH` requests emit `Content-Length: 0`; empty
`GET`/`HEAD`/`DELETE` requests omit it. The only remaining `usize` to `i32`
conversion is the explicit fail-closed boundary into the current
`std.stream.ByteLimit` substrate.
Caller-provided managed headers such as `Host`, `Connection`, and
`Content-Length` are rejected by checked header constructors. The client
`with_header` API accepts only `UserHeaderName` / `HeaderValue` evidence;
`with_checked_header` is the string convenience boundary and returns an error
instead of silently accepting or dropping managed headers. Direct wire lowering
still strips managed headers as a defensive boundary. A checked explicit
`Content-Type` overrides `RequestBody.media_type`; otherwise a safe non-empty
media type is lowered automatically, including for an empty typed body. Header
name matching and duplicate prevention are case-insensitive. There is no public
`edk.http.headers.normalize.header(HeaderName, HeaderValue)` helper; raw header
record construction is kept inside trusted EDK modules so package users cannot
choose that path instead of `user_header_name(...)`, `header_value(...)`, or
`parse_header(...)`.
The checked transport does write, flush, read, close, and decode the response
through public `std` substrate. It decodes the response head with
`std.http.codec.decode_response_head`, then decodes the full wire response so
body bytes are returned as `ResponseBody.raw`. Invalid response status values
are rejected as codec errors before the body path. Package-local response
helpers and the transport compatibility field decode raw bytes to text with
`Replace`, while `ResponseBody.raw` remains authoritative. Receiving a response
does not require valid UTF-8. Callers can explicitly choose
`decode_text_strict`, which maps `InvalidUtf8` to a codec `HttpError`, or
`decode_text_lossy`.

On TCP/TLS stream write, flush, read, or TLS handshake failure, the transport
attempts best-effort `std.stream.close` before raising the original
`HttpError` classification. Cleanup close failures are ignored only in that
cleanup path so they do not hide the original transport failure.

TCP, TLS, stream write/flush/close, response body read, codec, and temporary
substrate-blocked failures are mapped through pure `edk.http.errors`
constructors before they are raised by the transport. Package smoke checks keep
those `HttpError.kind` classifications stable without faking network execution.
Package smoke keeps direct preflight-helper coverage runnable without faking
network execution, and now executes the public `request` unsupported-method
path to prove it raises `HttpError.invalid_method` before transport. The
positive pure-surface fixture now executes the full preflight rejection suite,
including invalid header name/value cases, without using a host fallback.

Full successful runtime execution of public HTTP calls requires explicit host
authorization and a checked public target. The earlier loopback runtime probe is
now a host/internal-target blocker: `PublicHttpUrl` intentionally does not
represent `127.0.0.1` or other private/reserved hosts. Local tests should be
driven by internal host binding metadata or an `InternalHttpUrl` constructor,
not by weakening `PublicHttpUrl`. The checked source intentionally keeps an
explicit source handler; it must not be replaced by metadata fallback or an
inline fake handler to make demos pass.

Executable smoke coverage now includes parsing explicit `host:port` URL
authority. The source model keeps `Url.port`, direct constructor/preflight
validation rejects invalid ports, and transport connects with
`Net.tcp_connect[host, port]`.

Typed JSON helpers are intentionally not part of the current public HTTP layer.
`std.json.JsonValue`, `parse`, and `stringify` are source-visible to package
code and covered by the internal `edk.http.json_probe`, but EDK has not accepted
the JSON error-to-`HttpError` model or public metadata shape. JSON support
should be added later as a separate typed layer rather than as stringly
`post_json` or `fetch_json` shortcuts.

`edk.http.body.bytes` and `edk.http.body.response_bytes` currently carry
encoded byte text in the shared `RequestBody`/`ResponseBody` shape. They are
not a replacement for public byte/text codec substrate.

Relevant blockers:

- `tests/blocked/edk-http-default-handler-substrate.txt`
- `tests/blocked/edk-http-typed-json-codec.txt`
- `tests/blocked/edk-http-policy-templates.txt`
- `tests/blocked/edk-http-mock-dry-run-trace.txt`
- `tests/fixtures/negative/custom_action_scope_gap`
- `std-requirements/substrate-gaps.md`

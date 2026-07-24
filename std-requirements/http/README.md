# HTTP Std Requirements

These fixtures track the EDK HTTP path against public `std` substrate. They are
not replacement tests for compiler, interpreter, or host crates; they keep EDK
source honest while those layers evolve.

See `coverage.md` for a requirement-by-requirement map from the HTTP objective
to current EDK evidence and explicit external blockers.

Run `sh verify.sh` from this directory to execute the current HTTP requirement
checks. The script materializes local package metadata for path-dependency
fixtures, verifies expected positive and negative diagnostics, and removes
generated `.etas` directories before exiting.
It also checks the production request path source files for forbidden mock,
private host, intrinsic, and empty-handler fallback markers.
Default verification does not open a listening socket or connect to local
network services. Set `ETAS_HTTP_RUN_LOOPBACK=1` to also start
`loopback_server.py` and run the real local HTTP contract with explicit
`--allow-effects --allow-net 127.0.0.1:<port>`.

Unless explicitly noted, path-dependency fixtures here are check-level probes.
Package-local runtime smoke remains in `packages/edk-http`; external
path-dependency effect-fact replay is covered by
`positive/external_root_api_effect_facts`.

Positive fixtures:

- `positive/edk_http_request_contract` proves request construction, body
  preservation, and timeout/body-limit/retry/redirect option preservation
  before transport. Source-level root API effect coverage for
  `edk.http.request/get/post/...` is verified by
  `edk.http.package_api_contract`: the root facade delegates to
  `edk.http.api`, direct `edk.http.api` calls and root wrappers accept absolute
  URL strings, parse them before constructing requests, call the single public
  `request(req)` path, and current summaries report the package action family
  `EdkHttp.request` plus the bottom std actions. Method and host stay in the
  runtime action payload for policy and trace.
  This is recorded in `tests/golden-effects/edk-http-request.txt`.
- `positive/external_root_api_effect_facts` proves external path-dependency
  calls to effectful root `edk.http.get/post` APIs and direct
  `edk.http.api.get/post` imports replay checked effect facts after
  `etas pkg update`.
- `positive/std_stream_substrate` proves `TcpStream` and `TlsStream` satisfy the
  `std.stream` `ByteStream` bound for `write_all`, `flush`,
  `read_until_limit`, and `close`.
- `positive/http_wire_request_shape` proves the source-visible
  `std.http.codec.HttpWireRequest` shape can carry `version`, `List<HttpHeader>`
  headers, checked `Host` and `Connection: close` headers, and a non-empty
  `bytes` body produced by `std.codec.text.utf8_encode`.
- Legacy source-local policy fixtures have been removed. The package action
  family remains `EdkHttp.request`; reusable allow/deny templates are blocked
  until payload-aware monitor/check metadata can inspect `HttpActionRequest`.
- `positive/edk_http_error_mapping_contract` records the source-level preflight
  rejection contract for scope mismatch, unsupported method, invalid URL/path,
  invalid header name/value, managed `Host`/`Connection`/`Content-Length`
  headers,
  non-positive body limit, negative body length, body-limit overflow, timeout,
  redirect, and retry policy, plus
  TCP/TLS/Stream/response-read `HttpError` mapping
  constructors at check level. Private/reserved hosts remain source-classified
  for future policy metadata, but are not rejected by default, so local test
  servers can use the same HTTP request path. Package-local `etas run .`
  covers the stable pure constructor and preflight-helper checks, plus the public
  `request(TRACE ...)` invalid-method path before transport. Package-local
  runtime smoke also covers public invalid URL, body-limit overflow, and
  negative body-length rejection before transport.
- `positive/std_bytes_len_runtime` proves `std.bytes.len` is runtime-callable.
- `positive/http_codec_result_match` proves source-level
  `match decode_response(...) { Ok/Err(MalformedMessage) }` runs.
- `positive/http_text_decode_modes` proves `Strict` and `Replace` are
  source-visible `std.codec.text` values for `utf8_decode`.
- `positive/http_response_body_text_decode` proves response body bytes can be
  decoded to text through the public std text codec.
- `positive/stream_error_limit_import` proves directly imported
  `std.stream.LimitExceeded` is source-visible and runtime-matchable.
- `positive/stream_error_limit_variant` proves qualified
  `StreamError.LimitExceeded` is source-visible and runtime-matchable.

Negative fixtures:

- `negative/private_host_binding_forbidden` proves a high-level
  `std.http.request` host binding is not part of the public substrate.
- `negative/client_request_entry_forbidden` keeps `edk.http.client.request` and
  `edk.http.client.get/post/put/patch/delete/head` from becoming a second
  public HTTP execution layer. Root `edk.http.request/get/post/put/patch/delete/head`
  remain the public request execution surface.
- `negative/opinionated_api_forbidden` proves `edk.http.post_json`,
  `edk.http.api.post_json`, and
  `edk.http.tools.fetch_json/fetch_text/submit_json` are not exported. Typed
  JSON or fetch helpers must wait for a real typed JSON layer instead of
  string shortcuts.
- `negative/empty_handler_forbidden` proves empty `handler {}` values cannot
  satisfy `EdkHttp.request` at runtime and therefore cannot be used as fake HTTP
  default implementations.
- `negative/unhandled_action_no_handler` proves direct
  `perform EdkHttp.request(request)` against the real `edk_http` package must
  not run without an explicit handler. EDK must not restore the old
  `request(method, host, request)` signature to make this pass.
- `edk.http.transport.execute_request` remains source-visible because the
  current language has no package-private cross-module visibility. The
  bottom-action contract is verified package-locally with `edk.http.transport`,
  `edk.http.package_api_contract`, and `tests/golden-effects/edk-http-request.txt`;
  package-private export control is tracked as a tooling gap, not papered over
  with a fake negative fixture.
Still blocked outside these fixtures:

- exported package policy templates such as `HttpReadOnly`, `HttpAllowHosts`,
  `HttpDenyMutations`, `HttpNoPrivateNetwork`, `HttpRequireTimeout`, and
  `HttpBoundedBody`, tracked in `tests/blocked/edk-http-policy-templates.txt`;
- runtime execution of source handler values with preserved bottom
  `Tcp/Stream/Tls` actions requires explicit host authorization. The package-local
  `check_loopback_runtime_contract` flow uses real get/post/body-limit and
  malformed-response paths and is paired with `loopback_server.py`, a local
  HTTP/1.1 server fixture for `/hello`, `/echo`, `/large`, and `/malformed`.
  Without `--allow-net` it fails closed with `TCP host adapter is not
  configured`; with explicit `--allow-effects --allow-net 127.0.0.1:<port>`
   the loopback contract returns `0`. `verify.sh` keeps the authorized runtime
   check opt-in via `ETAS_HTTP_RUN_LOOPBACK=1`;
- pre-incremental-framing Phase 1 pure contracts run in the default `edk-http`
  smoke and cover request byte length, forged metadata, method-specific
  `Content-Length`, `Content-Type`, and response compatibility. Run
  `ETAS_HTTP_RUN_PHASE1=1 sh verify.sh` to additionally execute the authorized
  invalid UTF-8 and NUL-containing loopback response contracts. The binary
  routes use connection-close responses and do not implement or test
  package-local incremental framing.

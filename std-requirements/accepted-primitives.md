# Accepted Substrate Primitives

This file records low-level `std` substrate primitives that EDK packages are
allowed to build on once they are accepted by the language/runtime design.

The language design now accepts the following low-level substrate shape. These
entries are design-approved targets; an entry may still be unimplemented in the
compiler, interpreter, runtime, or EDK source.

| Area | Public std API | Action owner | EDK use |
|---|---|---|---|
| TCP | `std.net.tcp.connect` | `Net.tcp_connect<host, port>` | `edk-http`, `edk-email`, `edk-db`, provider adapters |
| Byte streams | `std.stream.read`, `read_until_limit`, `write_all`, `flush`, `close` | `Stream.*[stream]` | HTTP, SMTP, database protocols, browser transport |
| TLS | `std.tls.connect` | `Tls.handshake<server_name>` | HTTPS, SMTP over TLS, provider clients |
| Filesystem | `std.fs.read_bytes`, `write_bytes`, `list`, `stat`, `atomic_replace` | `Fs.*[path]` | `edk-workspace`, docs/PDF/eval fixtures |
| HTTP codec | `std.http.codec.*` | none | pure wire-level `HttpWire*` request/response framing for `edk-http` |
| Text codecs | `std.codec.text.*` | none | bytes/string conversion for workspace, HTTP, docs, PDF |
| Secret read/use | `std.secret.read`, secret-backed `std.crypto.hmac_sha256<K>` | `Secret.read<K>`, `Secret.use<K>` | tokens, webhook secrets, provider credentials, non-revealing signatures |
| Public deterministic crypto | `std.crypto.sha256`, hashes, digest encoding, `constant_time_eq` | none | byte hashing, digest formatting, public comparisons |
| Browser protocol | `std.browser.protocol.*` | `Browser.attach/send/recv/screenshot/close[...]` | `edk-browser` default handlers |

Naming rules:

- source APIs use lowercase paths such as `std.net.tcp.connect`;
- action owners use uppercase names without a `Std` prefix, such as `Net`,
  `Stream`, `Tls`, `Fs`, and `Browser`;
- high-level EDK APIs keep package-owned action names such as `EdkHttp.request`,
  `EdkWorkspace.write`, and `EdkBrowser.navigate`.

EDK packages must not replace these primitives with package-private host
bindings. If an accepted primitive is not implemented yet, the package records
an implementation gap and keeps the production default handler blocked.

Golden trace status.

No production golden action traces are checked in yet.

Reason:

- architecture-level golden traces must prove handler order, policy behavior,
  idempotency/replay metadata, and scoped package-owned action facts;
- current EDK action handlers are intentionally not implemented because public
  stream/TLS/browser/filesystem/database/vector/PDF/document/eval substrate and
  package-defined action scope metadata are not available;
- writing synthetic traces for `EdkHttp.*`, `EdkWorkspace.*`, `EdkEmail.*`,
  `EdkDb.*`, `EdkVector.*`, `EdkBrowser.*`, `EdkGitHub.*`, `EdkPdf.*`,
  `EdkDocs.*`, or `EdkEval.*` would be fallback behavior and would hide missing
  runtime authority boundaries.

Trace coverage that is currently safe lives in source fixtures and
`tests/golden-effects/`: it records expected action rows and pure trace-matcher
behavior without pretending that a runtime handler executed.

First real trace candidates once substrate exists:

- workspace read/write/list with path scopes;
- email send with approval and idempotency metadata;
- browser navigate/read with origin scopes;
- eval read/write with workspace artifact paths.

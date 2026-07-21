# EDK Packages

This directory contains the Etas EDK package sources. The current
implementation is intentionally source-first: pure helpers, package-owned
effect boundaries, mock data constructors, policy templates, positive/negative
fixtures, golden effect notes, and explicit blocked substrate gaps live in this
repository. Production default handlers are not filled in with fake responses or
private host bindings.

Initial package set:

- `edk-http`
- `edk-web`
- `edk-workspace`
- `edk-email`
- `edk-db`
- `edk-vector`
- `edk-algorithm`
- `edk-browser`
- `edk-git`
- `edk-github`
- `edk-pdf`
- `edk-docs`
- `edk-eval`

Each package must be implemented as an ordinary Etas package, without compiler
private privileges.

Package-mode execution currently passes for all smoke packages listed in
`tests/interpreter-smoke/package-smokes.txt`, including packages that depend on
other local EDK packages. Remaining gaps under `tests/blocked/` are runtime,
trace/replay, scoped metadata, substrate, or imported-tool-call boundaries, not
path dependency materialization failures.

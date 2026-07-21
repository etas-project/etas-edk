# EDK Package Layout

## 1. Standard Package Shape

Each EDK package should eventually use this shape:

```text
packages/edk-name/
  etas.toml
  src/
    edk/
      name/
        ...
  tests/
    positive/
    negative/
    golden-effects/
    golden-traces/
  mocks/
  trace_specs/
  docs/
```

The initial skeleton creates only package directories. Implementation files and
package-local manifests should be added together with the package contract and
tests.

The detailed per-package file plan is specified in
`package-implementation-design.md`.

## 2. Module Naming

Package names use kebab-case for distribution:

```text
edk-http
edk-workspace
edk-github
```

Source modules use dotted package namespaces:

```text
edk.http
edk.http.client
edk.workspace.files
edk.github.issue
```

Public effect tags should use explicit EDK ownership:

```text
EdkHttp
EdkWorkspace
EdkGitHub
```

They must not use old standard-library names such as `Web`, `Workspace`,
`Email`, or `Payment` as if those were built-in std effects.

## 3. Metadata Contract

Each package must eventually publish metadata for:

- public type signatures;
- public flows and tools;
- public effect/action declarations;
- exported handler values as ordinary public symbols when the package API uses
  them explicitly;
- tool schemas;
- determinism class;
- trust/provenance of returned data;
- idempotency and replay behavior;
- mock binding identifiers.

The package manager and frontend consume this metadata through the ordinary
package metadata path. EDK does not receive a privileged metadata channel.

## 4. Implementation Rule

High-level public APIs must be Etas implementations over public substrate APIs.
If that is not possible, record a substrate gap first. Do not add bodyless
high-level tools as the main EDK implementation.

Acceptable exceptions:

- test mocks;
- generated Etas source checked normally;
- platform acceleration that preserves an Etas reference implementation;
- temporary substrate gaps explicitly tracked under `std-requirements/`.

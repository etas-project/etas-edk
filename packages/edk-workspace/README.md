# edk-workspace

Initial source modules:

- `edk.workspace.effects`
- `edk.workspace.types`
- `edk.workspace.errors`
- `edk.workspace.files`
- `edk.workspace.path`
- `edk.workspace.glob`
- `edk.workspace.snapshot`
- `edk.workspace.pure.path_normalize`
- `edk.workspace.pure.glob_match`
- `edk.workspace.mocks.filesystem`
- `edk.workspace.tools.files`
- `edk.workspace.policies.workspace_policies`

`files.read`, `files.write`, and `files.list` perform package-owned
`EdkWorkspace.*` actions. No default filesystem handler is published yet because
public project-root-scoped filesystem substrate is still missing.
Runtime path-escape rejection before the `EdkWorkspace.*` action boundary is
tracked in `tests/blocked/edk-workspace-path-escape-runtime-guard.txt`; the
source must not substitute empty reads/lists or no-op writes for escaped paths.

`read_text` and `write_text` are intentionally not implemented in this slice:
they require an accepted bytes/text codec surface. Exposing string-only file
actions would hide the real low-level substrate boundary.

`edk.workspace.package_smoke` covers path escape rejection including absolute,
parent-segment, backslash, drive-style, and CR/LF/tab control-character path
forms, child path joining, `.`/duplicate-slash path normalization,
segment-aware glob/scope matching with single-segment `*`, recursive `**`,
negative nested-path and prefix-collision cases, conservative non-matching for
unsupported multi-wildcard path segments, escaped scope/glob rejection for
absolute, parent-segment, and control-character patterns, write option builders,
snapshots, and deterministic filesystem fixture constructors without invoking
the filesystem action boundary. Its required-path helper raises
`WorkspaceError` on constructor failure instead of reusing the error payload as
path evidence.

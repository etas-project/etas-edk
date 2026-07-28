# edk-db

Initial source modules:

- `edk.db.effects`
- `edk.db.types`
- `edk.db.errors`
- `edk.db.sql`
- `edk.db.pool`
- `edk.db.transaction`
- `edk.db.pure.sql_check`
- `edk.db.pure.row_decode`
- `edk.db.mocks.in_memory`
- `edk.db.tools.query`
- `edk.db.policies.db_policies`

`sql.query` and `sql.exec` perform package-owned `EdkDb.query` and
`EdkDb.exec` actions. No default database handler is published yet.

The current action family form is `EdkDb.query` and `EdkDb.exec`.
`DatasourceRef` remains payload data until EDK introduces checked datasource
evidence and package metadata can publish a typed static selector. The gap is
tracked in `tests/std-requirements/substrate-gaps.md`.

The higher-order `transaction(ds, body)` API is intentionally not implemented in
this slice because callback latent-effect preservation is not available through
package metadata yet. EDK does not publish replacement begin/commit/rollback
execution wrappers, opaque host callbacks, or pure callback assumptions as a
fallback transaction API.

`edk.db.package_smoke` covers conservative SQL classification, including mixed
readonly/mutation statements, semicolon-delimited statement boundaries,
CR/LF/tab whitespace normalization, comment-adjacent and function-style keyword
boundaries, leading block-comment keyword prefixes such as
`/*leading*/delete`, high-impact mutation keywords such as
`merge`/`grant`/`call`, and conservative admin/session mutation keywords such
as `vacuum`, `analyze`, `pragma`, `set`, `use`, `lock`, and `refresh`. It also
covers a readonly identifier negative case such as `deleted_at`, savepoint
transaction statements, named placeholder validation for `:name` and `@name`
parameters, row cell lookup, pool options, transaction option records, and
deterministic query/exec result constructors without invoking a database
handler.
The pure `explain_query` tool delegation is covered by source fixtures rather
than by the executable package smoke entry, because tools are
model-callable boundaries and are not ordinary runtime call targets.

`query_readonly` is intentionally not exported in this slice. It must reject
non-readonly SQL before requesting `EdkDb.query`, but that requires
package-defined typed errors plus datasource policy metadata. Until then, only
pure classification and `explain_query` are published; see
`tests/blocked/edk-db-query-readonly-runtime-guard.txt`.

The architected `run_migration` tool remains pending because it must require an
explicit high-impact migration policy. Publishing it as a bare `exec` wrapper
would hide the missing policy metadata; see
`tests/blocked/edk-db-run-migration-policy.txt`.

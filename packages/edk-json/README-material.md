# Material access and calculation

The `edk.material` modules live in `edk-json`. They project evidence from one
loaded material, provide search/read operations, and perform cited arithmetic.
The financial harness loop itself lives in its separate repository.

## Input and projection

`edk.material.service.load_material(input, material_id)` supports two shapes:

- Legacy TAT-QA: `table.uid`, `table.table` (an array of string rows), and
  `paragraphs` with `uid` (or `id`), numeric `order` and string `text`.
- Canonical multi-table: nonempty `id`, nonempty `tables`, and `paragraphs`.
  Each table has `id` (or `uid`), `cells` (or `table`), and optional string
  `source`/`unit`. Paragraphs use `uid` (or `id`), `text`, optional numeric
  `order` (defaults to zero) and optional string `source`. The root can carry
  string `provenance`.

The presence of root `tables` selects the canonical path. Canonical material
IDs must match the package `id`; an empty library `material_id` uses that ID.
Legacy materials default an empty ID to `material`. Table/paragraph IDs must
be nonempty, and canonical table IDs and paragraph IDs must be unique.
Canonical table loops are limited to 256 entries.

Table cells and paragraph text remain strings. The loaded `Material` retains
the projected evidence and metadata, not the original parsed JSON or its
question, answer, derivation and relation fields. Evidence text itself is
preserved as supplied; this is field projection, not arbitrary text redaction.
Optional metadata with a non-string value is treated as absent.

The library returns `MaterialLoad` and `DocumentResult` records. Check `ok`
before accessing their material/document or error fields. Loading distinguishes
`invalid-json`, `missing-field`, `invalid-type`, `invalid-value` and
`reference-mismatch` cases. Index effects may also propagate from JSON access.

## Read and search

`read(material, kind, id, row, column)` supports `paragraph`, `table`, `row`
and `cell`. Table coordinates are zero-based. The result includes a `source`
object with material ID, table/paragraph ID and applicable coordinates, plus
available source/provenance metadata. Table reads also include the declared
unit when present. Errors include `invalid-request`, `invalid-reference`,
`not-found` and `out-of-range`.

`search(material, query, limit)` trims and lowercases the query and performs
substring matching against lowercased evidence. It visits tables in input
order, rows in row order, then paragraphs in input order. Row text joins cells
with spaces; paragraph text is preserved. Results include source coordinates.
Empty queries and nonpositive limits return `invalid-query` and `invalid-limit`.
This is not ranked retrieval or a multi-material index.

## Calculations

`edk.material.number.calculate(material, operation, cell_refs, units)` reads
each cited cell. `CellRef` contains `material`, `table`, `row` and `column`;
the library supports references across tables of the same loaded material.
Every reference needs an explicit unit, and all operands must use the same
unit label. Results contain the formula, raw and parsed operands, source
coordinates, units, decimal-string result and precision statement.

| Operation | Operands | Result |
| --- | --- | --- |
| `sum` | One or more | Sum, retaining the explicit unit |
| `difference` | Two: A, B | A minus B, retaining the unit |
| `ratio` | Two: A, B | A divided by B, dimensionless |
| `growth` | Two: current, base | `(current-base)/base*100`, percent |

Zero ratio denominators and growth bases return `division-by-zero`.
Reference mismatch, out-of-range coordinates, invalid numbers, unsupported
operations and unit mismatches return structured errors.

Numeric cells support outer whitespace, negative signs, parentheses for
negatives, correctly grouped commas, a leading `$`, ordinary decimal numbers
and a trailing `%`. A leading plus, conflicting negative markers, blanks,
dashes, `N/A`, malformed commas and scientific notation are unsupported.
Arithmetic uses i128 fixed point with scale 1,000,000: at most 15 integer
digits and six fractional digits, or four meaningful fractional digits before
the percent sign. Division rounds half away from zero. There is no binary
floating-point arithmetic or automatic unit conversion here.

`12%` parses to `0.12`; with unit `percent`, adding `12%` and `8%` returns
`20`, while their difference returns `4`. Percent inputs require the exact
unit label `percent` or `%`; labels must still agree across operands. A `$`
marker requires a `$`-prefixed unit label.

Canonical materials additionally enforce table-unit metadata:

- `unknown` or `unspecified` table units reject calculations.
- A declared nonempty unit must equal the requested unit.
- Without a table unit, an unmarked number is rejected. A currency marker can
  establish `$`, but cannot establish a scale such as `$m`.

`calculate_values(operation, raw_values, units)` is a separate library helper
for 1–32 supplied values, returning `ArithmeticResult` with `ok`, `result`,
`unit` and `error`. It applies the same arithmetic and marker/unit checks,
but has no material references or table metadata and supplies no provenance.
Callers using prior calculated values must maintain their own evidence chain.

## CLI

Run from the `etas-edk` repository root with a compatible release CLI:

```sh
export ETAS=/path/to/etas
export ETAS_HOST_MEMORY=memory
"$ETAS" run --cache off --allow-effects --format text --flow material \
  packages/edk-json --args search revenue 10 dev/000014 < material.json
"$ETAS" run --cache off --allow-effects --format text --flow material \
  packages/edk-json --args read cell TABLE_UID 3 1 dev/000014 < material.json
"$ETAS" run --cache off --allow-effects --format text --flow material \
  packages/edk-json --args calculate growth TABLE_UID 3 1 '$' 3 2 '$' < material.json
```

Arguments after `--args` are:

```text
search QUERY [LIMIT [MATERIAL_ID]]
read paragraph|table ID [MATERIAL_ID]
read row TABLE_ID ROW [MATERIAL_ID]
read cell TABLE_ID ROW COLUMN [MATERIAL_ID]
calculate OPERATION TABLE_ID ROW COLUMN UNIT [ROW COLUMN UNIT ...]
```

Search defaults to limit 20. Read/search default to material ID `material`;
pass the canonical package ID explicitly for canonical inputs. The calculate
CLI always uses material ID `material` and one table ID, so canonical input
must have `id: "material"` for this CLI path. Use the library API for arbitrary
canonical IDs or cross-table calculations.

Ordinary CLI results/errors are JSON; inspect `ok` and `error.code`. Do not
rely only on process exit status: the current CLI does not automatically map a
nonzero flow result to a nonzero process exit status. Fatal runtime failures
are not guaranteed to produce a material JSON response.

## Verification and integration

```sh
python3 -B packages/edk-json/tests/material_oracle.py --etas "$ETAS"
python3 -B packages/edk-json/tests/material_oracle.py --etas "$ETAS" \
  --material /path/to/tatqa-materials-v1/dev/000014.json
```

The oracle invokes ETAS with synthetic answer markers, checks projected
search/read results and errors, and compares calculations against Python
Decimal externally. The optional real-material check reads the complete table
and verifies revenue cells `$39,506` and `$39,383`, including growth
`0.312317` percent. This oracle covers the legacy TAT-QA/CLI path; it does not
establish complete canonical multi-table or `calculate_values` coverage.

The [2026-09-22 verification](tests/results/cleanup-20260922.json) reran this
oracle including that real material. Full TAT-QA dataset validation and
performance measurements remain historical evidence under `tests/results/`.

The same-package material flow remains the runnable entry. Normal EDK path
dependencies and a standalone package remain affected by the existing
standard-action selector metadata compatibility issue. The financial harness
uses build-time source assembly; its runtime tool logic remains ETAS.

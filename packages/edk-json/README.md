# edk-json

JSON document parsing, access, construction, serialization and comparison for
ETAS, with material access/calculation and experiment statistics helpers in the
same package. The package version is `0.1.0`.

The document parser, reader and serializer are implemented in ETAS. Unicode
escape decoding currently delegates a quoted escape fragment to
`std.json.parse` and `std.json.stringify`, because the available runtime lacks
a Unicode scalar constructor. This is not a wholly independent JSON parser.
Python scripts are external development/test oracles, not production parsing
or arithmetic implementations.

## Document API

- `edk.json.parser.parse(text)` returns `Parsed`. Check `cursor.ok` before
  using `cursor.document`; `cursor.error` describes parse failures.
- `edk.json.serializer.stringify(document)` serializes a valid rooted document.
- `edk.json.arena.node`, `child`, `child_id` and `field` provide node access.
  A missing field or non-object field lookup yields kind `missing`, distinct
  from JSON `null`. Typed reads use `read_string`, `read_number`, `read_bool`,
  `is_missing` and `is_null`.
- `empty_document`, `append`, `with_root` and the `make_*` constructors build
  documents. Retain the returned document after each operation. Object member
  names are stored in the child node's `key` field.

Numbers are preserved as JSON number text, without implicit binary floating
point conversion. Nodes use integer IDs and blocks of 256; callers should use
the arena API rather than depend on physical storage. Index operations can
also raise `Error<IndexError>`.

Supported values are objects, arrays, strings, numbers, booleans and null,
including nested and empty containers and direct UTF-8 text. String escapes
include quote, backslash, slash, `\b`, `\f`, `\n`, `\r`, `\t` and `\uXXXX`,
including valid UTF-16 surrogate pairs. Malformed Unicode escapes, unpaired
surrogates and unescaped C0 control characters are rejected. Serialization
escapes C0 controls. The Unicode helper intentionally contains literal control
characters, including NUL; Git may display that source file as binary.

`make_number(raw)` does not validate JSON number syntax. Constructors do not
comprehensively validate arbitrary manually built documents, child IDs or
cycles. Parsing rejects trailing content, malformed numbers and malformed
container syntax, but this package has not completed a full RFC 8259
conformance suite. It does not promise duplicate-key rejection.

## Array reader and file processing

`edk.json.reader.array_reader(text)` and `next_item(reader)` consume a top-level
array. Each result has one of these states:

- `ok`: `item` is an independent document; retain `result.reader` for the next call.
- `end`: the closing array and remaining whitespace have been validated.
- Neither flag: inspect `error`; the returned failed reader remains failed.

Consume through `end` to validate the complete input. A valid prefix can be
returned before a later error; stopping early is not full-file validation.
Calls after end remain at end. Avoid accumulating documents when reducing
in-flight document storage is the goal.

This API holds the entire supplied input as line segments, scans element
boundaries, and passes one captured element at a time to the parser. It is not
streaming file I/O or constant-memory parsing. Long lines/elements, recursion
and explicit iteration limits remain resource constraints.

From the repository root, using a compatible release CLI:

```sh
export ETAS=/path/to/etas
export ETAS_HOST_MEMORY=memory
printf '%s' '{"amount":12.5,"evidence":[null,true]}' \
  | "$ETAS" run packages/edk-json --allow-effects --format text --args smoke
"$ETAS" run packages/edk-json --allow-effects --format text --args reader-json \
  < /path/to/tatqa_dataset_dev.json > reader-dev.jsonl
```

`probe` runs API checks; `dev` and `train` validate whole-document TAT-QA
structure. `reader-json` emits one value per line and writes
`EDK_READER_COMPLETE` to stderr only after consuming the whole array.
`reader-dev` and `reader-train` are traversal/count diagnostics.

The separate `--flow files` entry accepts an ordered newline-delimited list of
relative material filenames. `files-json` reads, UTF-8 decodes, parses and
serializes each file; `files-read` measures reads without JSON parsing.
Use a read-only runtime region named `edk.json.tatqa.MaterialRoot`, and unset
legacy `ETAS_HOST_FILESYSTEM`/`ETAS_HOST_WORKSPACE_ROOT` overrides.
`tests/split_tatqa.py` prepares material files externally;
`tests/benchmark_material_files.py` creates the read-only profile and validates
outputs. These scripts expose their options through `--help`.

## Comparison and numeric semantics

`edk.json.compare.equivalent(left, right)` parses both strings and returns false
when either parse fails. Its rules target the canonical JSON serialization used
by the existing Python replay baseline, not arbitrary mathematical equality:

- Object key order is ignored; duplicate keys use their last value.
- Array order, scalar kinds and decoded string contents matter.
- Integer and floating lexemes differ: `1` is not equivalent to `1.0`.
  Integer text is preserved exactly, except integer `-0` equals `0`.
- Lexemes containing a decimal point or exponent use binary64 conversion.
  `1.0` equals `1e0`; floating `-0.0` differs from `0.0`.
  Distinct decimal inputs can compare equal after binary64 rounding.

`edk.json.binary64.key(raw)` performs decimal-rational conversion with
round-to-nearest, ties-to-even, including subnormals, signed zero and overflow
to signed infinity keys. It requires an already validated JSON number; its
keys are comparison representations, not JSON number output. This comparison
path is separate from both the lossless number-text document model and the
material calculator's fixed-point arithmetic.

## Material and statistics helpers

`edk.material.service` loads legacy TAT-QA or canonical multi-table materials,
then searches and reads projected evidence with source coordinates.
`edk.material.number` provides explicit-unit fixed-point calculations.
Use `--flow material` for the CLI. See [Material access](README-material.md)
for formats, commands, errors and calculation limits.

`edk.experiment.statistics` provides `nonnegative`, `decimal`, `fraction` and
`summarize`. Samples are nonnegative integer strings of at most 30 digits;
summary loops are limited to 1,024 samples. Summaries retain input-order raw
values and report count, min, max and an exact integer/half-integer median.
Empty or invalid samples return `ok=false`. `decimal` expects nonnegative
values. `fraction` expects nonnegative counts and emits six truncated decimal
places, or `null` for a nonpositive denominator. No confidence intervals or
controlled benchmark conclusions are implied.

## Verification and integration status

Run from the repository root with `ETAS` set as above:

```sh
"$ETAS" check packages/edk-json --all --format json
python3 -B packages/edk-json/tests/verify_probe.py --etas "$ETAS"
python3 -B packages/edk-json/tests/unicode_oracle.py
python3 -B packages/edk-json/tests/compare_oracle.py
python3 -B packages/edk-json/tests/material_oracle.py --etas "$ETAS"
```

Always use the probe wrapper: the current CLI can return process status zero
for a nonzero flow result. The wrapper verifies the interpreter result is
i32 zero, diagnostics are empty, and the outcome is completed when present.
Material callers must inspect the JSON `ok` field. Temporary oracle packages
under `tmp/` are ignored by Git.

The [2026-09-22 verification record](tests/results/cleanup-20260922.json)
records 16 modules with no diagnostics, 38 valid/38 invalid Unicode cases,
18 comparison cases, 23 binary64 cases and material regression with a real
TAT-QA material. The initial probe still rejected supported `\b`/`\f`; that
assertion was updated and its round trip checked. The
[final probe report](tests/results/probe-20260922.verification.json) passed.
The record distinguishes tested source hashes from final whitespace cleanup.

Earlier whole-file TAT-QA dev/train checks preserved 278/2,201 groups and
1,668/13,215 questions. Those reports and timings in `tests/results/` are
historical evidence for their recorded source fingerprints. The full dataset
and performance benchmarks were not rerun for the 2026-09-22 cleanup.
Data preservation is not question-answering accuracy.

### Native path dependency (verified 2026-09-25)

The financial harness now uses `../etas-edk/packages/edk-json` as a native
local path dependency. Its production ETAS source lives under `src/` and
imports shared modules from the `edk` root; package locking, checking,
running, replay and reports need no Python preparation, `.build` source
assembly or manual copying of EDK sources. Python remains limited to external test
oracles and drivers.

This integration was verified with the fixed CLI
`/home/zhangpuyang/etas-project/native-dependency-acceptance-20260925/bin/etas`
(SHA256 `0dbef4fcfb442ff55a125ee3cbe70ff776757e6652409bf952e2b2372bc8844d`)
and these component revisions:

| Component | Revision |
| --- | --- |
| etas | `9f2e63f67ee9cc160a69ce79500d3d529d34217f` |
| etas-core | `a7c85379dd31cd6a5d1c8097e6464fb6e3428312` |
| etas-frontend | `3198ccfa14c395e6a25a1fe8e600f3f0529d8402` |
| etas-interpreter | `2b373dd53b312b6200ca4c16f81bf265e5bd90f6` |
| EDK package snapshot | `35a1ffb5d03f30ec9c8da52ccec3c46168b711de` |

The EDK revision identifies the package snapshot used for verification;
later documentation commits can advance the branch without changing that
snapshot. The harness `etas.lock` records package content and metadata
hashes, but a local path dependency does not pin the adjacent Git revision.
Older CLI builds without these fixes may fail package locking or standard-spec
binding. The compiler fixes were verified on
`perf/interpreter-values-checkpoints`.

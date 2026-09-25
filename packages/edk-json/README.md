# edk-json

JSON document parsing, access, construction, serialization and comparison for
ETAS. The package version is `0.1.0`.

The document parser, reader and serializer are implemented in ETAS. Unicode
escape decoding currently delegates a quoted escape fragment to
`std.json.parse` and `std.json.stringify`, because the available runtime lacks
a Unicode scalar constructor. This is not a wholly independent JSON parser.
Python scripts are external development/test oracles, not production JSON
parsing implementations.

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
path is separate from the lossless number-text document model.

## Verification and integration status

Run from the repository root with `ETAS` set as above:

```sh
"$ETAS" check packages/edk-json --all --format json
python3 -B packages/edk-json/tests/verify_probe.py --etas "$ETAS"
python3 -B packages/edk-json/tests/unicode_oracle.py
python3 -B packages/edk-json/tests/compare_oracle.py
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

### Financial modules moved (2026-09-25)

Material loading, evidence projection, fixed-point calculations, the material CLI, and experiment statistics have moved to the financial harness under `src/financial/`. The harness owns their current code, CLI, regression oracle, and documentation; this package now contains JSON modules only. The 2026-09-22 material verification entries above describe the then-current source and remain historical records, not a retest of the migrated modules.


The JSON-only package and the relocated harness were verified together on
2026-09-25 using the fixed CLI listed below. All 14 checks passed, including
clean native dependency loading, package checks, JSON probes, material and
multi-table calculations, reports, loopback model-error tests, ten scripted
task replays with independent answer checks, and eight saved real-model
recordings. Replay matched requests, tool results, and final states; it does
not change the business accuracy of those saved model answers. No new paid
model requests were made.

### Native path dependency baseline (2026-09-25; pre-finance-refactor)

The 2026-09-25 native path-dependency acceptance predates the financial-module
ownership move described above. This historical integration used
`../etas-edk/packages/edk-json` as a local path dependency; the harness compiled
its own `src/` tree and imported JSON modules from the `edk` root without Python
source assembly. The fixed CLI used for that baseline was
`/home/zhangpuyang/etas-project/native-dependency-acceptance-20260925/bin/etas`
(SHA256 `0dbef4fcfb442ff55a125ee3cbe70ff776757e6652409bf952e2b2372bc8844d`)
and these component revisions:

| Component | Revision |
| --- | --- |
| etas | `9f2e63f67ee9cc160a69ce79500d3d529d34217f` |
| etas-core | `a7c85379dd31cd6a5d1c8097e6464fb6e3428312` |
| etas-frontend | `3198ccfa14c395e6a25a1fe8e600f3f0529d8402` |
| etas-interpreter | `2b373dd53b312b6200ca4c16f81bf265e5bd90f6` |
| EDK package snapshot (pre-finance-refactor) | `35a1ffb5d03f30ec9c8da52ccec3c46168b711de` |

The EDK revision identifies the historical pre-refactor package snapshot,
not the current JSON-only source state. Later commits can advance the branch
without changing that record. The harness `etas.lock` records package content
and metadata hashes, but a local path dependency does not pin the adjacent Git
revision.
Older CLI builds without these fixes may fail package locking or standard-spec
binding. The compiler fixes were verified on
`perf/interpreter-values-checkpoints`.

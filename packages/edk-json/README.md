# edk-json

ETAS-native JSON parsing, document access, construction and serialization for the
financial evidence harness. Logic is in `src/edk/json/*.es`; Python is only an
external test oracle and no host JSON parser is called.

## API

- `edk.json.parser.parse(text)` returns a `Parsed`; check `parsed.cursor.ok`
  before using `parsed.cursor.document`.
- `edk.json.serializer.stringify(document)` serializes a valid document.
- `edk.json.reader.array_reader(text)` and `next_item(reader)` read a top-level
  array incrementally. `next_item` returns `ok` with an independent `item`,
  `end` at the closing delimiter, or an `error`. On `ok`, pass `result.reader`
  to the next call and consume until `end`.

## Quick start

From the repository root, set `ETAS_BIN` to a release ETAS CLI:

```sh
ETAS_BIN=/path/to/etas
python3 -B packages/edk-json/tests/verify_probe.py --etas "$ETAS_BIN"
```

Read JSON from stdin and print its serialized form:

```sh
printf '%s' '{"amount":12.5,"evidence":[null,true]}' \
  | ETAS_HOST_MEMORY=memory "$ETAS_BIN" run packages/edk-json \
    --allow-effects --format text --args smoke
```

## Limits

Supports objects, arrays, strings, JSON number text, booleans and null, with the
escapes quote, backslash, slash, newline, carriage return and tab. Unicode `\u`,
backspace `\b` and formfeed `\f` escapes are unsupported. This is a
TAT-QA-oriented reader, not a complete RFC 8259 conformance implementation. The
whole input stays in memory; the incremental reader yields one document at a time.

TAT-QA dev and train were checked end-to-end for data preservation. Scripts and
evidence are under [`tests/`](tests/).

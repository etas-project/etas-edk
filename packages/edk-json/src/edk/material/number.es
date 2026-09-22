module edk.material.number;

import std.text.{contains, join, lowercase, split, starts_with, ends_with, to_string_i32, trim};
import edk.json.arena.{append, empty_document, make_array, make_bool,
    make_number, make_object, make_string, node, with_root};
import edk.json.types.{JsonDocument, JsonNode};
import edk.material.service.{DocumentResult, Material, MaterialError};

public type CellRef = { material: string, table: string, row: i32, column: i32 };
public type ParsedNumber = {
    ok: bool,
    scaled: i128,
    raw: string,
    normalized: string,
    is_percent: bool,
    is_currency: bool,
    error: string,
};

let SCALE: i128 = 1000000;
let MAX_INTEGER_DIGITS: i32 = 15;

type BuildState = { document: JsonDocument, ids: Array<i32> };
type Built = { document: JsonDocument, id: i32 };

flow empty_error() -> MaterialError ![] {
    return MaterialError { code = "", message = "" };
}
flow failed(code: string, message: string) -> DocumentResult ![] {
    return DocumentResult {
        ok = false, document = empty_document(),
        error = MaterialError { code = code, message = message },
    };
}
flow count_strings(values: Array<string>) -> i32 ![] {
    var n = 0;
    for value in values limit Iterations(65536) { n = n + 1; }
    return n;
}
flow count_refs(values: Array<CellRef>) -> i32 ![] {
    var n = 0;
    for value in values limit Iterations(65536) { n = n + 1; }
    return n;
}
flow chars(value: string) -> Array<string> ![] {
    let raw = split(value, "");
    let out: Array<string> = [];
    var result = out;
    for c in raw limit Iterations(65536) {
        if c != "" { result = result.push(c); }
    }
    return result;
}
flow digit(value: string) -> i128 ![] {
    if value == "0" { return 0; }
    if value == "1" { return 1; }
    if value == "2" { return 2; }
    if value == "3" { return 3; }
    if value == "4" { return 4; }
    if value == "5" { return 5; }
    if value == "6" { return 6; }
    if value == "7" { return 7; }
    if value == "8" { return 8; }
    if value == "9" { return 9; }
    return -1;
}
flow all_digits(value: string) -> bool ![] {
    let letters = chars(value);
    if count_strings(letters) == 0 { return false; }
    for c in letters limit Iterations(65536) {
        if digit(c) < 0 { return false; }
    }
    return true;
}
flow power10(count: i32) -> i128 ![] {
    var out: i128 = 1;
    var i = 0;
    while i < count limit Iterations(64) {
        out = out * 10;
        i = i + 1;
    }
    return out;
}
flow parse_digits(value: string) -> i128 ![] {
    var out: i128 = 0;
    for c in chars(value) limit Iterations(65536) {
        out = out * 10 + digit(c);
    }
    return out;
}
flow valid_integer(value: string) -> bool ![Error<IndexError>] {
    let groups = split(value, ",");
    let n = count_strings(groups);
    if n == 0 { return false; }
    if n == 1 { return all_digits(groups[0]); }
    var index = 0;
    for group in groups limit Iterations(65536) {
        let width = count_strings(chars(group));
        if !all_digits(group) { return false; }
        if index == 0 {
            if width < 1 || width > 3 { return false; }
        } else if width != 3 {
            return false;
        }
        index = index + 1;
    }
    return true;
}
flow strip_outer(value: string, first: i32, last: i32) -> string ![] {
    let letters = chars(value);
    var out = "";
    var index = 0;
    for c in letters limit Iterations(65536) {
        if index >= first && index < last { out = out + c; }
        index = index + 1;
    }
    return out;
}
flow parse_number(input: string) -> ParsedNumber ![Error<IndexError>] {
    let original = input;
    var value = trim(input);
    if value == "" {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = false, is_currency = false,
            error = "blank numeric cell" };
    }
    let letters = chars(value);
    let length = count_strings(letters);
    var negative = false;
    var parenthesized = false;
    if starts_with(value, "(") || ends_with(value, ")") {
        if !starts_with(value, "(") || !ends_with(value, ")") || length < 3 {
            return ParsedNumber { ok = false, scaled = 0, raw = original,
                normalized = "", is_percent = false, is_currency = false,
                error = "malformed parentheses" };
        }
        parenthesized = true;
        value = strip_outer(value, 1, length - 1);
    }
    if starts_with(value, "-") {
        negative = true;
        value = strip_outer(value, 1, count_strings(chars(value)));
    }
    if starts_with(value, "+") {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = false, is_currency = false,
            error = "plus sign is not supported" };
    }
    if parenthesized && negative {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = false, is_currency = false,
            error = "conflicting negative signs" };
    }
    var currency = false;
    if starts_with(value, "$") {
        currency = true;
        value = strip_outer(value, 1, count_strings(chars(value)));
        value = trim(value);
    }
    var percent = false;
    if ends_with(value, "%") {
        percent = true;
        let n = count_strings(chars(value));
        value = strip_outer(value, 0, n - 1);
        value = trim(value);
    }
    if contains(value, "$") || contains(value, "%") || value == "" {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = percent, is_currency = currency,
            error = "currency and percent markers must be in their outer positions" };
    }
    if trim(value) != value || contains(value, " ") || contains(value, "\t") {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = percent, is_currency = currency,
            error = "embedded whitespace is not numeric" };
    }
    let pieces = split(value, ".");
    let piece_count = count_strings(pieces);
    if piece_count < 1 || piece_count > 2 || !valid_integer(pieces[0]) {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = percent, is_currency = currency,
            error = "invalid integer or grouping" };
    }
    var fraction = "";
    if piece_count == 2 { fraction = pieces[1]; }
    let fraction_digits = count_strings(chars(fraction));
    if (piece_count == 2 && fraction_digits == 0) || fraction_digits > 6 ||
        (fraction_digits > 0 && !all_digits(fraction)) {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = percent, is_currency = currency,
            error = "fraction must contain one to six decimal digits" };
    }
    let integer_digits = count_strings(chars(join(split(pieces[0], ","), "")));
    if integer_digits > MAX_INTEGER_DIGITS {
        return ParsedNumber { ok = false, scaled = 0, raw = original,
            normalized = "", is_percent = percent, is_currency = currency,
            error = "integer part exceeds the supported 15 digit range" };
    }
    var scaled: i128 = parse_digits(join(split(pieces[0], ","), "")) * SCALE;
    if fraction_digits > 0 {
        scaled = scaled + parse_digits(fraction) * power10(6 - fraction_digits);
    }
    if percent {
        if scaled % 100 != 0 {
            return ParsedNumber { ok = false, scaled = 0, raw = original,
                normalized = "", is_percent = true, is_currency = currency,
                error = "percent has more than four meaningful decimal places" };
        }
        scaled = scaled / 100;
    }
    if negative || parenthesized { scaled = 0 - scaled; }
    let normalized = fixed_string(scaled);
    return ParsedNumber { ok = true, scaled = scaled, raw = original,
        normalized = normalized, is_percent = percent, is_currency = currency,
        error = "" };
}
flow decimal_digit(value: i128) -> string ![] {
    if value == 0 { return "0"; }
    if value == 1 { return "1"; }
    if value == 2 { return "2"; }
    if value == 3 { return "3"; }
    if value == 4 { return "4"; }
    if value == 5 { return "5"; }
    if value == 6 { return "6"; }
    if value == 7 { return "7"; }
    if value == 8 { return "8"; }
    return "9";
}
flow integer_string(value: i128) -> string ![] {
    if value == 0 { return "0"; }
    var n = value;
    var out = "";
    while n > 0 limit Iterations(64) {
        out = decimal_digit(n % 10) + out;
        n = n / 10;
    }
    return out;
}
flow trim_fraction(value: string) -> string ![Error<IndexError>] {
    let letters = chars(value);
    var n = count_strings(letters);
    while n > 0 limit Iterations(16) {
        if letters[n - 1] != "0" { break; }
        n = n - 1;
    }
    var out = "";
    var index = 0;
    for c in letters limit Iterations(16) {
        if index < n { out = out + c; }
        index = index + 1;
    }
    return out;
}
flow fixed_string(value: i128) -> string ![Error<IndexError>] {
    var negative = value < 0;
    var magnitude = value;
    if negative { magnitude = 0 - magnitude; }
    let whole = integer_string(magnitude / SCALE);
    let fraction = integer_string(magnitude % SCALE);
    let padded = "000000" + fraction;
    let fraction_chars = chars(padded);
    var six = "";
    let total_fraction_chars = count_strings(fraction_chars);
    var index = 0;
    for c in fraction_chars limit Iterations(32) {
        if index >= total_fraction_chars - 6 { six = six + c; }
        index = index + 1;
    }
    let short = trim_fraction(six);
    if short == "" {
        if negative { return "-" + whole; }
        return whole;
    }
    if negative { return "-" + whole + "." + short; }
    return whole + "." + short;
}
flow rounded_divide(numerator: i128, denominator: i128) -> i128 ![] {
    var negative = false;
    var n = numerator;
    var d = denominator;
    if n < 0 { negative = !negative; n = 0 - n; }
    if d < 0 { negative = !negative; d = 0 - d; }
    var q = n / d;
    let remainder = n % d;
    if remainder * 2 >= d { q = q + 1; }
    if negative { return 0 - q; }
    return q;
}

flow empty_state(document: JsonDocument) -> BuildState ![] {
    let ids: Array<i32> = [];
    return BuildState { document = document, ids = ids };
}
flow next_id(document: JsonDocument) -> i32 ![] {
    return document.full_chunks * 256 + document.tail_size;
}
flow keyed(item: JsonNode, key: string) -> JsonNode ![] {
    return JsonNode { kind = item.kind, key = key, text = item.text,
        children = item.children };
}
flow append_keyed(state: BuildState, key: string, item: JsonNode) -> BuildState ![] {
    let id = next_id(state.document);
    return BuildState { document = append(state.document, keyed(item, key)),
        ids = state.ids.push(id) };
}
flow put_string(state: BuildState, key: string, value: string) -> BuildState ![] {
    return append_keyed(state, key, make_string(value));
}
flow put_number(state: BuildState, key: string, value: string) -> BuildState ![] {
    return append_keyed(state, key, make_number(value));
}
flow put_i32(state: BuildState, key: string, value: i32) -> BuildState ![] {
    return append_keyed(state, key, make_number(to_string_i32(value)));
}
flow put_bool(state: BuildState, key: string, value: bool) -> BuildState ![] {
    return append_keyed(state, key, make_bool(value));
}
flow close_object(state: BuildState, key: string) -> Built ![] {
    let id = next_id(state.document);
    return Built { document = append(state.document, keyed(make_object(state.ids), key)), id = id };
}
flow close_array(state: BuildState, key: string) -> Built ![] {
    let id = next_id(state.document);
    return Built { document = append(state.document, keyed(make_array(state.ids), key)), id = id };
}
flow push_child(state: BuildState, child: Built) -> BuildState ![] {
    return BuildState { document = child.document, ids = state.ids.push(child.id) };
}
flow root_document(built: Built) -> JsonDocument ![] {
    return with_root(built.document, built.id);
}
flow source_ref(document: JsonDocument, material: Material, ref: CellRef) -> Built ![] {
    var state = empty_state(document);
    state = put_string(state, "material", ref.material);
    state = put_string(state, "table", ref.table);
    state = put_i32(state, "row", ref.row);
    state = put_i32(state, "column", ref.column);
    for table in material.tables limit Iterations(256) {
        if table.id == ref.table && table.source != "" { state = put_string(state, "source", table.source); }
    }
    if material.provenance != "" { state = put_string(state, "provenance", material.provenance); }
    return close_object(state, "source");
}
flow row_count(row: Array<string>) -> i32 ![] {
    var n = 0;
    for value in row limit Iterations(65536) { n = n + 1; }
    return n;
}
flow table_count(table: Array<Array<string>>) -> i32 ![] {
    var n = 0;
    for row in table limit Iterations(65536) { n = n + 1; }
    return n;
}
flow row_at(material: Material, target: i32) -> Array<string> ![] {
    var index = 0;
    for row in material.table limit Iterations(65536) {
        if index == target { return row; }
        index = index + 1;
    }
    let empty: Array<string> = [];
    return empty;
}
flow compatible_unit(unit: string, parsed: ParsedNumber) -> bool ![] {
    let label = trim(unit);
    if label == "" { return false; }
    if parsed.is_currency && !starts_with(label, "$") { return false; }
    if parsed.is_percent && label != "percent" && label != "%" { return false; }
    if !parsed.is_percent && (label == "percent" || label == "%") { return false; }
    return true;
}

public type ArithmeticResult = {
    ok: bool,
    result: string,
    unit: string,
    error: MaterialError,
};

flow arithmetic_error(code: string, message: string) -> ArithmeticResult ![] {
    return ArithmeticResult { ok = false, result = "", unit = "", error = MaterialError { code = code, message = message } };
}
flow arithmetic_compute(raw_operation: string, values: Array<ParsedNumber>, units: Array<string>) -> ArithmeticResult ![Error<IndexError>] {
    let operation = lowercase(trim(raw_operation));
    let n = count_strings(units);
    if n < 1 || n > 65536 { return arithmetic_error("invalid-reference", "values and units must have the same non-zero count"); }
    if operation != "sum" && operation != "difference" && operation != "ratio" && operation != "growth" { return arithmetic_error("invalid-operation", "unsupported arithmetic operation"); }
    var first_unit = "";
    var first_scaled: i128 = 0;
    var second_scaled: i128 = 0;
    var first_percent = false;
    var index = 0;
    for parsed in values limit Iterations(65536) {
        if !parsed.ok { return arithmetic_error("invalid-number", parsed.error); }
        let unit = trim(units[index]);
        if unit == "" { return arithmetic_error("unknown-unit", "unit must be nonempty"); }
        if !compatible_unit(unit, parsed) { return arithmetic_error("unit-mismatch", "explicit unit is incompatible with the cell marker"); }
        if index == 0 { first_unit = unit; first_scaled = parsed.scaled; first_percent = parsed.is_percent; }
        if index == 1 { second_scaled = parsed.scaled; }
        if index > 0 && unit != first_unit { return arithmetic_error("unit-mismatch", "all operands must use the same explicit unit"); }
        index = index + 1;
    }
    if (operation == "difference" || operation == "ratio" || operation == "growth") && n != 2 { return arithmetic_error("invalid-reference", "this operation requires exactly two values"); }
    if operation == "ratio" && second_scaled == 0 { return arithmetic_error("division-by-zero", "ratio denominator is zero"); }
    if operation == "growth" && second_scaled == 0 { return arithmetic_error("division-by-zero", "growth base is zero"); }
    var scaled: i128 = 0;
    var out_unit = first_unit;
    if operation == "sum" {
        for parsed in values limit Iterations(65536) { scaled = scaled + parsed.scaled; }
        if first_percent { scaled = scaled * 100; }
    } else if operation == "difference" { scaled = first_scaled - second_scaled; if first_percent { scaled = scaled * 100; }
    } else if operation == "ratio" { scaled = rounded_divide(first_scaled * SCALE, second_scaled); out_unit = "dimensionless";
    } else { scaled = rounded_divide((first_scaled - second_scaled) * 100 * SCALE, second_scaled); out_unit = "percent"; }
    return ArithmeticResult { ok = true, result = fixed_string(scaled), unit = out_unit, error = empty_error() };
}
public flow calculate_values(operation: string, raw_values: Array<string>, units: Array<string>) -> ArithmeticResult ![Error<IndexError>] {
    if count_strings(raw_values) != count_strings(units) || count_strings(raw_values) < 1 || count_strings(raw_values) > 32 { return arithmetic_error("invalid-reference", "values and units must have the same non-zero count"); }
    var parsed_values: Array<ParsedNumber> = [];
    for raw in raw_values limit Iterations(32) { parsed_values = parsed_values.push(parse_number(raw)); }
    return arithmetic_compute(operation, parsed_values, units);
}

public flow calculate(material: Material, operation: string, cell_refs: Array<CellRef>,
    units: Array<string>) -> DocumentResult ![Error<IndexError>] {
    let op = lowercase(trim(operation));
    let ref_count = count_refs(cell_refs);
    if op != "sum" && op != "difference" && op != "ratio" && op != "growth" {
        return failed("invalid-operation", "operation must be sum, difference, ratio or growth");
    }
    if ref_count == 0 || count_strings(units) != ref_count {
        return failed("invalid-reference", "cell_refs and units must have the same non-zero count");
    }
    if op == "sum" {
        if ref_count < 1 { return failed("invalid-reference", "sum requires at least one reference"); }
    } else if ref_count != 2 {
        return failed("invalid-reference", "difference, ratio and growth require exactly two references");
    }
    var values: Array<ParsedNumber> = [];
    var refs: Array<CellRef> = [];
    var normalized_units: Array<string> = [];
    var index = 0;
    var first_unit = "";
    for ref in cell_refs limit Iterations(65536) {
        if ref.material != material.material_id {
            return failed("reference-mismatch", "cell reference material does not match the loaded material");
        }
        var table_data: Array<Array<string>> = material.table;
        var table_found = false;
        var table_unit = "";
        for table in material.tables limit Iterations(256) {
            if table.id == ref.table { table_data = table.cells; table_unit = table.unit; table_found = true; }
        }
        if table_found == false {
            return failed("reference-mismatch", "cell reference material or table does not match the loaded material");
        }
        if ref.row < 0 || ref.row >= table_count(table_data) {
            return failed("out-of-range", "cell reference row is out of range");
        }
        var row: Array<string> = [];
        var row_index = 0;
        for candidate in table_data limit Iterations(65536) { if row_index == ref.row { row = candidate; } row_index = row_index + 1; }
        if ref.column < 0 || ref.column >= row_count(row) {
            return failed("out-of-range", "cell reference column is out of range");
        }
        let parsed = parse_number(row[ref.column]);
        if !parsed.ok { return failed("invalid-number", parsed.error); }
        let unit = trim(units[index]);
        if material.canonical {
            if table_unit == "unknown" || table_unit == "unspecified" {
                return failed("unknown-unit", "table unit is unknown");
            }
            if table_unit != "" && unit != table_unit {
                return failed("unit-mismatch", "requested unit differs from the table unit");
            }
            if table_unit == "" {
                if !parsed.is_currency && !parsed.is_percent { return failed("unknown-unit", "unmarked number has no table unit"); }
                if parsed.is_currency && unit != "$" { return failed("unknown-unit", "currency marker does not establish a scale"); }
            }
        }
        if !compatible_unit(unit, parsed) {
            return failed("unit-mismatch", "explicit unit is incompatible with the cell marker");
        }
        if index == 0 {
            first_unit = unit;
        }
        if unit != first_unit {
            return failed("unit-mismatch", "all operands must use the same explicit unit");
        }
        values = values.push(parsed);
        refs = refs.push(ref);
        normalized_units = normalized_units.push(unit);
        index = index + 1;
    }
    let computed = arithmetic_compute(op, values, normalized_units);
    if !computed.ok { return failed(computed.error.code, computed.error.message); }
    var state = empty_state(empty_document());
    state = put_bool(state, "ok", true);
    state = put_string(state, "operation", op);
    if op == "sum" { state = put_string(state, "formula", "A+B+... (fixed point)"); }
    if op == "difference" { state = put_string(state, "formula", "A-B (fixed point)"); }
    if op == "ratio" { state = put_string(state, "formula", "A/B (rounded fixed point)"); }
    if op == "growth" { state = put_string(state, "formula", "(current-base)/base*100 (percent)"); }
    state = put_string(state, "unit", computed.unit);
    state = put_string(state, "result", computed.result);
    state = put_string(state, "precision", "base-10 fixed point, six fractional digits; division rounds half away from zero");
    var operand_state = empty_state(state.document);
    var operand_index = 0;
    for parsed in values limit Iterations(65536) {
        var one = empty_state(operand_state.document);
        one = put_string(one, "raw", parsed.raw);
        one = put_string(one, "parsed", parsed.normalized);
        one = put_string(one, "unit", normalized_units[operand_index]);
        let source = source_ref(one.document, material, refs[operand_index]);
        one = push_child(one, source);
        let built = close_object(one, "");
        operand_state = push_child(operand_state, built);
        operand_index = operand_index + 1;
    }
    let operands = close_array(operand_state, "operands");
    state = push_child(state, operands);
    let root = close_object(state, "");
    return DocumentResult { ok = true, document = root_document(root), error = empty_error() };
}

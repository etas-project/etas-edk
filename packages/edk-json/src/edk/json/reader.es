module edk.json.reader;

import std.text.{join, split};
import edk.json.arena.empty_document;
import edk.json.parser.parse;
import edk.json.types.JsonDocument;

public type ArrayReader = {
    lines: Array<string>,
    line_count: i32,
    line_index: i32,
    char_index: i32,
    line_chars: Array<string>,
    line_length: i32,
    chars_ready: bool,
    phase: string,
    error: string,
};

public type ArrayItem = {
    reader: ArrayReader,
    item: JsonDocument,
    ok: bool,
    end: bool,
    error: string,
};

flow count_lines(lines: Array<string>) -> i32 ![] {
    var count = 0;
    for line in lines limit Iterations(20000000) {
        count = count + 1;
    }
    return count;
}

flow count_chars(parts: Array<string>) -> i32 ![] {
    var count = 0;
    for part in parts limit Iterations(20000000) {
        if part != "" {
            count = count + 1;
        }
    }
    return count;
}

public flow array_reader(input: string) -> ArrayReader ![] {
    let lines = split(input, "\n");
    return ArrayReader {
        lines = lines,
        line_count = count_lines(lines),
        line_index = 0,
        char_index = 1,
        line_chars = [],
        line_length = 0,
        chars_ready = false,
        phase = "start",
        error = "",
    };
}

flow update(
    r: ArrayReader,
    line_index: i32,
    char_index: i32,
    line_chars: Array<string>,
    line_length: i32,
    chars_ready: bool,
    phase: string,
    error: string,
) -> ArrayReader ![] {
    return ArrayReader {
        lines = r.lines,
        line_count = r.line_count,
        line_index = line_index,
        char_index = char_index,
        line_chars = line_chars,
        line_length = line_length,
        chars_ready = chars_ready,
        phase = phase,
        error = error,
    };
}

flow load_line(r: ArrayReader) -> ArrayReader ![Error<IndexError>] {
    let line = r.lines[r.line_index];
    let chars = split(line, "");
    return update(r, r.line_index, 1, chars, count_chars(chars), true, r.phase,
        r.error);
}

flow next_line(r: ArrayReader) -> ArrayReader ![] {
    return update(r, r.line_index + 1, 1, [], 0, false, r.phase, r.error);
}

flow advance_char(r: ArrayReader) -> ArrayReader ![] {
    return update(r, r.line_index, r.char_index + 1, r.line_chars,
        r.line_length, r.chars_ready, r.phase, r.error);
}

flow capture_segment(r: ArrayReader, start: i32, end: i32,
    pieces: Array<string>) -> Array<string> ![Error<IndexError>] {
    if end <= start {
        return pieces;
    }
    let selected: Slice<string> = r.line_chars[start, end);
    let part = join(selected.to_array(), "");
    return pieces.push(part);
}

flow backslash() -> string ![Error<IndexError>] {
    return split("\\", "")[1];
}

flow whitespace(ch: string) -> bool ![] {
    return ch == " " || ch == "\r" || ch == "\t";
}

flow error_result(r: ArrayReader, message: string) -> ArrayItem ![] {
    let failed = update(r, r.line_index, r.char_index, r.line_chars,
        r.line_length, r.chars_ready, "error", message);
    return ArrayItem {
        reader = failed,
        item = empty_document(),
        ok = false,
        end = false,
        error = message,
    };
}

flow end_result(r: ArrayReader) -> ArrayItem ![] {
    return ArrayItem {
        reader = r,
        item = empty_document(),
        ok = false,
        end = true,
        error = "",
    };
}

flow emit_item(r: ArrayReader, pieces: Array<string>, next_phase: string) ->
    ArrayItem ![Error<IndexError>] {
    let parsed = parse(join(pieces, ""));
    if !parsed.cursor.ok {
        return error_result(r, parsed.cursor.error);
    }
    let ready = update(r, r.line_index, r.char_index, r.line_chars,
        r.line_length, r.chars_ready, next_phase, "");
    return ArrayItem {
        reader = ready,
        item = parsed.cursor.document,
        ok = true,
        end = false,
        error = "",
    };
}

public flow next_item(reader: ArrayReader) -> ArrayItem ![Error<IndexError>] {
    if reader.phase == "error" {
        return error_result(reader, reader.error);
    }
    var out = reader;
    var pieces: Array<string> = [];
    var segment_start = 1;
    var depth = 0;
    var in_string = false;
    var escaped = false;
    let slash = backslash();

    while true limit Iterations(20000000) {
        if out.phase == "after" {
            if out.line_index >= out.line_count {
                return end_result(out);
            }
            if !out.chars_ready {
                out = load_line(out);
            }
            if out.char_index > out.line_length {
                if out.line_index + 1 < out.line_count {
                    out = next_line(out);
                    continue;
                }
                return end_result(out);
            }
            let after_char = out.line_chars[out.char_index];
            out = advance_char(out);
            if !whitespace(after_char) {
                return error_result(out, "trailing input after top-level array");
            }
            continue;
        }

        if out.line_index >= out.line_count {
            if out.phase == "start" {
                return error_result(out, "missing top-level array");
            }
            if out.phase == "first" || out.phase == "comma" {
                return error_result(out, "unterminated top-level array");
            }
            if in_string {
                return error_result(out, "unterminated string at end of input");
            }
            return error_result(out, "unterminated array item");
        }

        if !out.chars_ready {
            out = load_line(out);
        }
        if out.char_index > out.line_length {
            if out.line_index + 1 < out.line_count {
                if in_string {
                    return error_result(out, "unescaped newline in string");
                }
                if out.phase == "item" {
                    pieces = capture_segment(out, segment_start,
                        out.line_length + 1, pieces);
                    pieces = pieces.push("\n");
                    segment_start = 1;
                }
                out = next_line(out);
                continue;
            }
            if out.phase == "start" {
                return error_result(out, "missing top-level array");
            }
            if out.phase == "first" || out.phase == "comma" {
                return error_result(out, "unterminated top-level array");
            }
            if in_string {
                return error_result(out, "unterminated string at end of input");
            }
            return error_result(out, "unterminated array item");
        }

        let char_pos = out.char_index;
        let ch = out.line_chars[char_pos];
        out = advance_char(out);

        if out.phase == "start" {
            if whitespace(ch) {
                continue;
            }
            if ch != "[" {
                return error_result(out, "top-level value is not an array");
            }
            out = update(out, out.line_index, out.char_index, out.line_chars,
                out.line_length, out.chars_ready, "first", "");
            continue;
        }

        if out.phase == "first" || out.phase == "comma" {
            if whitespace(ch) {
                continue;
            }
            if ch == "]" {
                if out.phase == "comma" {
                    return error_result(out, "trailing comma in top-level array");
                }
                out = update(out, out.line_index, out.char_index, out.line_chars,
                    out.line_length, out.chars_ready, "after", "");
                continue;
            }
            if ch == "," {
                return error_result(out, "empty array item");
            }
            segment_start = char_pos;
            pieces = [];
            if ch == "\"" {
                in_string = true;
            } else if ch == "[" || ch == "{" {
                depth = 1;
            } else if ch == "}" {
                return error_result(out, "unexpected object close");
            }
            out = update(out, out.line_index, out.char_index, out.line_chars,
                out.line_length, out.chars_ready, "item", "");
            continue;
        }

        if in_string {
            if ch == "\r" || ch == "\t" {
                return error_result(out, "unescaped control character in string");
            }
            if escaped {
                escaped = false;
            } else if ch == slash {
                escaped = true;
            } else if ch == "\"" {
                in_string = false;
            }
            continue;
        }

        if ch == "\"" {
            in_string = true;
            continue;
        }
        if ch == "[" || ch == "{" {
            depth = depth + 1;
            continue;
        }
        if ch == "]" {
            if depth > 0 {
                depth = depth - 1;
                continue;
            }
            pieces = capture_segment(out, segment_start, char_pos, pieces);
            out = update(out, out.line_index, out.char_index, out.line_chars,
                out.line_length, out.chars_ready, "after", "");
            return emit_item(out, pieces, "after");
        }
        if ch == "}" {
            if depth == 0 {
                return error_result(out, "unexpected object close");
            }
            depth = depth - 1;
            continue;
        }
        if ch == "," && depth == 0 {
            pieces = capture_segment(out, segment_start, char_pos, pieces);
            out = update(out, out.line_index, out.char_index, out.line_chars,
                out.line_length, out.chars_ready, "comma", "");
            return emit_item(out, pieces, "comma");
        }
    }
}

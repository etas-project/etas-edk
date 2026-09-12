module edk.json.parser;

import edk.json.util.count_chars;
import std.text.{join, split, to_string_i32};
import edk.json.arena.{append, node, with_root};
import edk.json.types.{JsonDocument, JsonNode};

public type Cursor = {
    chars: Array<string>,
    length: i32,
    pos: i32,
    document: JsonDocument,
    ok: bool,
    error: string,
    key: string,
};

public type Parsed = {
    cursor: Cursor,
    node_id: i32,
};

flow cursor(input: string) -> Cursor ![] {
    return Cursor {
        chars = split(input, ""),
        length = count_chars(split(input, "")),
        pos = 0,
        document = JsonDocument { chunks = [], tail = [], full_chunks = 0, tail_size = 0, root = 0 },
        ok = true,
        error = "",
        key = "",
    };
}

flow fail(c: Cursor, message: string) -> Parsed ![] {
    return Parsed {
        cursor = Cursor {
            chars = c.chars,
            length = c.length,
            pos = c.pos,
            document = c.document,
            ok = false,
            error = message,
            key = c.key,
        },
        node_id = -1,
    };
}

flow peek(c: Cursor) -> string ![Error<IndexError>] {
    return c.chars[c.pos + 1];
}

flow advance(c: Cursor) -> Cursor ![] {
    return Cursor {
        chars = c.chars,
        length = c.length,
        pos = c.pos + 1,
        document = c.document,
        ok = c.ok,
        error = c.error,
        key = c.key,
    };
}

flow whitespace(value: string) -> bool ![] {
    return value == " " || value == "\n" || value == "\r" || value == "\t";
}

flow skip(c: Cursor) -> Cursor ![Error<IndexError>] {
    var out = c;
    while out.pos < out.length && whitespace(peek(out)) limit Iterations(20000000) {
        out = advance(out);
    }
    return out;
}

flow scalar(c: Cursor, kind: string, text: string) -> Parsed ![] {
    let node = JsonNode { kind = kind, key = c.key, text = text, children = [] };
    let next_document = append(c.document, node);
    return Parsed {
        cursor = Cursor {
            chars = c.chars,
            length = c.length,
            pos = c.pos,
            document = with_root(next_document, c.document.root + 1),
            ok = true,
            error = "",
            key = c.key,
        },
        node_id = c.document.root,
    };
}

flow literal(c: Cursor, expected: string, kind: string) -> Parsed ![Error<IndexError>] {
    let pieces = split(expected, "");
    var current = c;
    var index = 1;
    while index <= count_chars(split(expected, "")) limit Iterations(20000000) {
        if current.pos >= current.length || peek(current) != pieces[index] {
            return fail(current, "invalid literal at position " + to_string_i32(current.pos));
        }
        current = advance(current);
        index = index + 1;
    }
    return scalar(current, kind, expected);
}

flow hex_value(value: string) -> i32 ![] {
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
    if value == "a" || value == "A" { return 10; }
    if value == "b" || value == "B" { return 11; }
    if value == "c" || value == "C" { return 12; }
    if value == "d" || value == "D" { return 13; }
    if value == "e" || value == "E" { return 14; }
    if value == "f" || value == "F" { return 15; }
    return -1;
}

flow unicode_unit(c: Cursor) -> i32 ![Error<IndexError>] {
    return hex_value(c.chars[c.pos + 2]) * 4096
        + hex_value(c.chars[c.pos + 3]) * 256
        + hex_value(c.chars[c.pos + 4]) * 16
        + hex_value(c.chars[c.pos + 5]);
}

flow advance_n(c: Cursor, count: i32) -> Cursor ![] {
    var out = c;
    var index = 0;
    while index < count limit Iterations(16) {
        out = advance(out);
        index = index + 1;
    }
    return out;
}

flow bs() -> string ![Error<IndexError>] {
    return split("\\", "")[1];
}

flow string_value(c: Cursor) -> Parsed ![Error<IndexError>] {
    var current = advance(c);
    var pieces: Array<string> = [];
    while current.pos < current.length limit Iterations(20000000) {
        let ch = peek(current);
        if ch == "\"" {
            let text = join(pieces, "");
            return scalar(advance(current), "string", text);
        }
        if ch == bs() {
            current = advance(current);
            if current.pos >= current.length {
                return fail(current, "truncated escape at position " + to_string_i32(current.pos));
            }
            let escaped = peek(current);
            if escaped == "\"" || escaped == bs() || escaped == "/" {
                pieces = pieces.push(escaped);
            } else if escaped == "b" || escaped == "f" {
                return fail(current, "backspace/formfeed escape decoding unavailable at position " + to_string_i32(current.pos));
            } else if escaped == "n" {
                pieces = pieces.push("\n");
            } else if escaped == "r" {
                pieces = pieces.push("\r");
            } else if escaped == "t" {
                pieces = pieces.push("\t");
            } else if escaped == "u" {
                return fail(current, "unicode escape decoding unavailable at position " + to_string_i32(current.pos));
            } else {
                return fail(current, "invalid escape at position " + to_string_i32(current.pos));
            }
            current = advance(current);
        } else {
            if ch == "\n" || ch == "\r" || ch == "\t" {
                return fail(current, "unescaped control character at position " + to_string_i32(current.pos));
            }
            pieces = pieces.push(ch);
            current = advance(current);
        }
    }
    return fail(current, "unterminated string at position " + to_string_i32(current.pos));
}

flow digits(value: string) -> bool ![] {
    return value == "0" || value == "1" || value == "2" || value == "3"
        || value == "4" || value == "5" || value == "6" || value == "7"
        || value == "8" || value == "9";
}

flow number_value(c: Cursor) -> Parsed ![Error<IndexError>] {
    var current = c;
    var pieces: Array<string> = [];
    if peek(current) == "-" {
        pieces = pieces.push("-");
        current = advance(current);
    }
    if current.pos >= current.length || !digits(peek(current)) {
        return fail(current, "invalid number at position " + to_string_i32(current.pos));
    }
    if peek(current) == "0" {
        pieces = pieces.push("0");
        current = advance(current);
        if current.pos < current.length && digits(peek(current)) {
            return fail(current, "leading zero at position " + to_string_i32(current.pos));
        }
    } else {
        while current.pos < current.length && digits(peek(current)) limit Iterations(20000000) {
            pieces = pieces.push(peek(current));
            current = advance(current);
        }
    }
    if current.pos < current.length && peek(current) == "." {
        pieces = pieces.push(".");
        current = advance(current);
        if current.pos >= current.length || !digits(peek(current)) {
            return fail(current, "fraction requires digits at position " + to_string_i32(current.pos));
        }
        while current.pos < current.length && digits(peek(current)) limit Iterations(20000000) {
            pieces = pieces.push(peek(current));
            current = advance(current);
        }
    }
    if current.pos < current.length && (peek(current) == "e" || peek(current) == "E") {
        pieces = pieces.push(peek(current));
        current = advance(current);
        if current.pos < current.length && (peek(current) == "+" || peek(current) == "-") {
            pieces = pieces.push(peek(current));
            current = advance(current);
        }
        if current.pos >= current.length || !digits(peek(current)) {
            return fail(current, "exponent requires digits at position " + to_string_i32(current.pos));
        }
        while current.pos < current.length && digits(peek(current)) limit Iterations(20000000) {
            pieces = pieces.push(peek(current));
            current = advance(current);
        }
    }
    return scalar(current, "number", join(pieces, ""));
}

flow parse_value(c: Cursor) -> Parsed ![Error<IndexError>] {
    let current = skip(c);
    if current.pos >= current.length {
        return fail(current, "expected value at position " + to_string_i32(current.pos));
    }
    let ch = peek(current);
    if ch == "\"" {
        return string_value(current);
    }
    if ch == "{" {
        return object_value(current);
    }
    if ch == "[" {
        return array_value(current);
    }
    if ch == "t" {
        return literal(current, "true", "bool");
    }
    if ch == "f" {
        return literal(current, "false", "bool");
    }
    if ch == "n" {
        return literal(current, "null", "null");
    }
    if ch == "-" || digits(ch) {
        return number_value(current);
    }
    return fail(current, "unexpected value at position " + to_string_i32(current.pos));
}

flow clear_key(c: Cursor) -> Cursor ![] {
    return Cursor {
        chars = c.chars,
        length = c.length,
        pos = c.pos,
        document = c.document,
        ok = c.ok,
        error = c.error,
        key = "",
    };
}

flow array_value(c: Cursor) -> Parsed ![Error<IndexError>] {
    let container_key = c.key;
    var current = clear_key(skip(advance(c)));
    var children: Array<i32> = [];
    if current.pos < current.length && peek(current) == "]" {
        let node = JsonNode { kind = "array", key = container_key, text = "", children = [] };
        let next_document = append(current.document, node);
        return Parsed {
            cursor = advance(Cursor {
                chars = current.chars,
                length = current.length,
                pos = current.pos,
                document = with_root(next_document, current.document.root + 1),
                ok = true,
                error = "",
                key = container_key,
            }),
            node_id = current.document.root,
        };
    }
    while true limit Iterations(20000000) {
        let parsed = parse_value(current);
        if !parsed.cursor.ok {
            return parsed;
        }
        children = children.push(parsed.node_id);
        current = clear_key(skip(parsed.cursor));
        if current.pos >= current.length {
            return fail(current, "unterminated array at position " + to_string_i32(current.pos));
        }
        if peek(current) == "]" {
            let node = JsonNode { kind = "array", key = container_key, text = "", children = children };
            let next_document = append(current.document, node);
            return Parsed {
                cursor = advance(Cursor {
                    chars = current.chars,
                    length = current.length,
                    pos = current.pos,
                    document = with_root(next_document, current.document.root + 1),
                    ok = true,
                    error = "",
                    key = container_key,
                }),
                node_id = current.document.root,
            };
        }
        if peek(current) != "," {
            return fail(current, "expected comma or ] at position " + to_string_i32(current.pos));
        }
        current = clear_key(skip(advance(current)));
    }
}

flow array_value_dummy(c: Cursor) -> Parsed ![] {
    return Parsed { cursor = c, node_id = -1 };
}

flow object_value(c: Cursor) -> Parsed ![Error<IndexError>] {
    let container_key = c.key;
    var current = clear_key(skip(advance(c)));
    var children: Array<i32> = [];
    if current.pos < current.length && peek(current) == "}" {
        let node = JsonNode { kind = "object", key = container_key, text = "", children = [] };
        let next_document = append(current.document, node);
        return Parsed {
            cursor = advance(Cursor {
                chars = current.chars,
                length = current.length,
                pos = current.pos,
                document = with_root(next_document, current.document.root + 1),
                ok = true,
                error = "",
                key = container_key,
            }),
            node_id = current.document.root,
        };
    }
    while true limit Iterations(20000000) {
        if current.pos >= current.length || peek(current) != "\"" {
            return fail(current, "object key must be string at position " + to_string_i32(current.pos));
        }
        let key_result = string_value(current);
        if !key_result.cursor.ok {
            return key_result;
        }
        let key_node = node(key_result.cursor.document, key_result.node_id);
        current = clear_key(skip(key_result.cursor));
        if current.pos >= current.length || peek(current) != ":" {
            return fail(current, "expected colon at position " + to_string_i32(current.pos));
        }
        let value_cursor = Cursor {
            chars = current.chars,
            length = current.length,
            pos = current.pos + 1,
            document = current.document,
            ok = true,
            error = "",
            key = key_node.text,
        };
        let value_result = parse_value(value_cursor);
        if !value_result.cursor.ok {
            return value_result;
        }
        children = children.push(value_result.node_id);
        current = clear_key(skip(value_result.cursor));
        if current.pos >= current.length {
            return fail(current, "unterminated object at position " + to_string_i32(current.pos));
        }
        if peek(current) == "}" {
            let node = JsonNode { kind = "object", key = container_key, text = "", children = children };
            let next_document = append(current.document, node);
            return Parsed {
                cursor = advance(Cursor {
                    chars = current.chars,
                    length = current.length,
                    pos = current.pos,
                    document = with_root(next_document, current.document.root + 1),
                    ok = true,
                    error = "",
                    key = container_key,
                }),
                node_id = current.document.root,
            };
        }
        if peek(current) != "," {
            return fail(current, "expected comma or } at position " + to_string_i32(current.pos));
        }
        current = clear_key(skip(advance(current)));
    }
}

public flow parse(input: string) -> Parsed ![Error<IndexError>] {
    let parsed = parse_value(cursor(input));
    if !parsed.cursor.ok {
        return parsed;
    }
    let current = skip(parsed.cursor);
    if current.pos != current.length {
        return fail(current, "trailing input at position " + to_string_i32(current.pos));
    }
    let rooted = with_root(current.document, parsed.node_id);
    return Parsed {
        cursor = Cursor {
            chars = current.chars,
            length = current.length,
            pos = current.pos,
            document = rooted,
            ok = true,
            error = "",
            key = current.key,
        },
        node_id = parsed.node_id,
    };
}

module probe;

import std.text.{join, len as text_len, split, from_usize};
import edk.json.arena.{append, child, child_id, empty_document, field, node, with_root};
import edk.json.parser.{parse};
import edk.json.reader.{array_reader, next_item};
import edk.json.serializer.stringify;
import edk.json.types.{JsonDocument, JsonNode};

flow scalar(key: string, kind: string, text: string) -> JsonNode ![] {
    return JsonNode { kind = kind, key = key, text = text, children = [] };
}

flow container(key: string, kind: string, children: Array<i32>) -> JsonNode ![] {
    return JsonNode { kind = kind, key = key, text = "", children = children };
}

flow build_nested() -> JsonDocument ![] {
    var document = empty_document();
    document = append(document, scalar("", "string", "deep"));
    document = append(document, container("", "object", [0]));
    document = append(document, container("items", "array", [1]));
    document = append(document, container("root", "object", [2]));
    return with_root(document, 3);
}

public flow main(args: Array<string>) -> i32 ![Error<IndexError>] {
    let parts = split("A中😀", "");
    let rebuilt = join(parts, "");
    let back = split("\\", "")[1];
    let newline = "\n";
    if from_usize(text_len(back)) != "1" { return 24; }
    let document = build_nested();
    let root = node(document, document.root);
    let array = field(document, document.root, "items");
    let object = child(document, child_id(document, document.root, 0), 0);
    let value = field(document, child_id(document, child_id(document, document.root, 0), 0), "");
    let missing = field(document, document.root, "absent");
    let wrong_parent = field(document, child_id(document, document.root, 0), "value");
    let parsed = parse("{\"items\":[{\"value\":\"deep\",\"n\":-12.50e+2}],\"ok\":true,\"none\":null}");
    if !parsed.cursor.ok {
        return 2;
    }
    let parsed_document = parsed.cursor.document;
    let parsed_items = field(parsed_document, parsed_document.root, "items");
    let parsed_object = child(parsed_document, child_id(parsed_document, parsed_document.root, 0), 0);
    let parsed_value = field(parsed_document, child_id(parsed_document, child_id(parsed_document, parsed_document.root, 0), 0), "value");
    let round_trip = stringify(parsed_document);
    if rebuilt != "A中😀" || parts[0] != "" || parts[1] != "A" || parts[2] != "中" || parts[3] != "😀" { return 10; }
    if root.kind != "object" || array.kind != "array" || object.kind != "object" || value.kind != "string" || value.text != "deep" { return 11; }
    if missing.kind != "missing" || wrong_parent.kind != "missing" { return 12; }
    if !parsed.cursor.ok { return 13; }
    if parsed_items.kind != "array" { return 141; }
    if parsed_object.kind != "object" { return 142; }
    if parsed_value.text != "deep" { return 143; }
    if round_trip != "{\"items\":[{\"value\":\"deep\",\"n\":-12.50e+2}],\"ok\":true,\"none\":null}" { return 15; }
    let valid = [
        "[]",
        "{}",
        "[[],1]",
        "[{},1]",
        "{\"a\":[],\"b\":2}",
        "[" + "\"" + back + "b" + back + "f" + "\"" + "]",
    ];
    for input in valid {
        let result = parse(input);
        if !result.cursor.ok || stringify(result.cursor.document) != input { return 16; }
    }
    let invalid = [
        "{\"a\":}",
        "[1,",
        "true false",
        "[" + "\"a" + newline + "b\"" + "]",
    ];
    for input in invalid {
        if parse(input).cursor.ok { return 17; }
    }
    let escaped_parse = parse("{" + "\"s\":\"a" + back + "n\"}");
    let escaped_value = field(escaped_parse.cursor.document, escaped_parse.cursor.document.root, "s");
    if escaped_value.text != "a" + newline { return 19; }
    if stringify(escaped_parse.cursor.document) != "{" + "\"s\":\"a" + back + "n\"}" { return 20; }
    return 0;
}

flow reader_backslash() -> string ![Error<IndexError>] {
    return split("\\", "")[1];
}

flow check(input: string, expected: Array<string>, count: i32) ->
    i32 ![Error<IndexError>] {
    var reader = array_reader(input);
    var seen = 0;
    while true {
        let result = next_item(reader);
        if result.ok {
            if seen >= count || stringify(result.item) != expected[seen] {
                return 1;
            }
            seen = seen + 1;
            reader = result.reader;
            continue;
        }
        if result.end {
            return if seen == count { 0 } else { 2 };
        }
        return 3;
    }
}

flow check_error(input: string) -> i32 ![Error<IndexError>] {
    var reader = array_reader(input);
    var steps = 0;
    while steps < 8 {
        let result = next_item(reader);
        if result.ok {
            reader = result.reader;
            steps = steps + 1;
            continue;
        }
        if result.end || result.error == "" {
            return 4;
        }
        let repeated = next_item(result.reader);
        if repeated.ok || repeated.end || repeated.error != result.error {
            return 5;
        }
        return 0;
    }
    return 6;
}

flow check_end_repeat() -> i32 ![Error<IndexError>] {
    let first = next_item(array_reader("[]"));
    if first.ok || !first.end {
        return 6;
    }
    let second = next_item(first.reader);
    if second.ok || !second.end {
        return 7;
    }
    return 0;
}

flow check_early_stop() -> i32 ![Error<IndexError>] {
    let first = next_item(array_reader("[1,2,3]"));
    return if first.ok && stringify(first.item) == "1" { 0 } else { 8 };
}

public flow reader(args: Array<string>) -> i32 ![Error<IndexError>] {
    let cases: Array<(string, Array<string>, i32, i32)> = [
        ("[1,{\"a\":[true,null]},\"x\"]", ["1", "{\"a\":[true,null]}", "\"x\""], 3, 10),
        ("[\n  {\"a\": [\n    1,\n    2\n  ]},\n  true\n]", ["{\"a\":[1,2]}", "true"], 2, 11),
        ("[1,2,true,null,\"x\"]", ["1", "2", "true", "null", "\"x\""], 5, 12),
        (" \n [ \n ] \n", [], 0, 13),
        ("[\"a" + reader_backslash() + reader_backslash() + reader_backslash() + "\"b\", \"c\"]", ["\"a" + reader_backslash() + reader_backslash() + reader_backslash() + "\"b\"", "\"c\""], 2, 14),
    ];
    for (input, expected, count, code) in cases {
        if check(input, expected, count) != 0 { return code; }
    }
    let invalid = [
        ("[1,]", 20),
        ("[1] trailing", 21),
        ("[] trailing", 28),
        ("[{\"a\":\n 1}", 22),
        ("[\"a\nb\"]", 23),
        ("[1,", 24),
        ("[1\n2]", 25),
        ("[tr\nue]", 29),
    ];
    for (input, code) in invalid {
        if check_error(input) != 0 { return code; }
    }
    if check_end_repeat() != 0 {
        return 26;
    }
    if check_early_stop() != 0 {
        return 27;
    }
    return 0;
}

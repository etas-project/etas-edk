module edk.json.probe;

import std.text.{join, len as text_len, split, to_string_usize};
import edk.json.arena.{append, child, child_id, empty_document, field, node, with_root};
import edk.json.parser.{parse};
import edk.json.reader_probe.{main as reader_probe_main};
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
    if to_string_usize(text_len(back)) != "1" { return 24; }
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
    let empty_array = parse("[]");
    let empty_object = parse("{}");
    let invalid = parse("{\"a\":}");
    let truncated = parse("[1,");
    let trailing = parse("true false");
    let nested_empty_array = parse("[[],1]");
    let nested_empty_object = parse("[{},1]");
    let empty_fields = parse("{\"a\":[],\"b\":2}");
    let escaped_parse = parse("{" + "\"s\":\"a" + back + "n\"}");
    let escaped_bf = parse("[" + "\"" + back + "b" + back + "f" + "\"" + "]");
    let raw_newline = parse("[" + "\"a" + newline + "b\"" + "]");
    if rebuilt != "A中😀" || parts[0] != "" || parts[1] != "A" || parts[2] != "中" || parts[3] != "😀" { return 10; }
    if root.kind != "object" || array.kind != "array" || object.kind != "object" || value.kind != "string" || value.text != "deep" { return 11; }
    if missing.kind != "missing" || wrong_parent.kind != "missing" { return 12; }
    if !parsed.cursor.ok { return 13; }
    if parsed_items.kind != "array" { return 141; }
    if parsed_object.kind != "object" { return 142; }
    if parsed_value.text != "deep" { return 143; }
    if round_trip != "{\"items\":[{\"value\":\"deep\",\"n\":-12.50e+2}],\"ok\":true,\"none\":null}" { return 15; }
    if !empty_array.cursor.ok || !empty_object.cursor.ok { return 16; }
    if invalid.cursor.ok || truncated.cursor.ok || trailing.cursor.ok { return 17; }
    if !nested_empty_array.cursor.ok || stringify(nested_empty_array.cursor.document) != "[[],1]" { return 22; }
    if !escaped_bf.cursor.ok || raw_newline.cursor.ok { return 26; }
    if stringify(escaped_bf.cursor.document) != "[" + "\"" + back + "b" + back + "f" + "\"" + "]" {
        return 27;
    }
    if !nested_empty_object.cursor.ok || stringify(nested_empty_object.cursor.document) != "[{},1]" { return 23; }
    if !empty_fields.cursor.ok || stringify(empty_fields.cursor.document) != "{\"a\":[],\"b\":2}" { return 25; }
    let escaped_value = field(escaped_parse.cursor.document, escaped_parse.cursor.document.root, "s");
    if escaped_value.text != "a" + newline { return 19; }
    if stringify(escaped_parse.cursor.document) != "{" + "\"s\":\"a" + back + "n\"}" { return 20; }
    let reader_probe = reader_probe_main();
    if reader_probe != 0 {
        return reader_probe;
    }
    return 0;
}

module edk.json.serializer;

import std.text.{join, split};
import edk.json.types.JsonDocument;
import edk.json.arena.node;

flow bs() -> string ![Error<IndexError>] {
    return split("\\", "")[1];
}

flow escaped(value: string) -> string ![Error<IndexError>] {
    var pieces: Array<string> = [];
    for ch in split(value, "") limit Iterations(20000000) {
        if ch == "\"" {
            pieces = pieces.push(bs() + "\"");
        } else if ch == bs() {
            pieces = pieces.push(bs() + bs());
        } else if ch == "\b" {
            pieces = pieces.push(bs() + "b");
        } else if ch == "\f" {
            pieces = pieces.push(bs() + "f");
        } else if ch == "\n" {
            pieces = pieces.push(bs() + "n");
        } else if ch == "\r" {
            pieces = pieces.push(bs() + "r");
        } else if ch == "\t" {
            pieces = pieces.push(bs() + "t");
        } else {
            pieces = pieces.push(ch);
        }
    }
    return join(pieces, "");
}

flow stringify_node(document: JsonDocument, id: i32) -> string ![Error<IndexError>] {
    let item = node(document, id);
    if item.kind == "null" || item.kind == "number" || item.kind == "bool" {
        return item.text;
    }
    if item.kind == "string" {
        return "\"" + escaped(item.text) + "\"";
    }
    var pieces: Array<string> = [];
    if item.kind == "array" {
        for child_id in item.children limit Iterations(20000000) {
            pieces = pieces.push(stringify_node(document, child_id));
        }
        return "[" + join(pieces, ",") + "]";
    }
    if item.kind == "object" {
        for child_id in item.children limit Iterations(20000000) {
            let child = node(document, child_id);
            pieces = pieces.push("\"" + escaped(child.key) + "\":" + stringify_node(document, child_id));
        }
        return "{" + join(pieces, ",") + "}";
    }
    return "";
}

public flow stringify(document: JsonDocument) -> string ![Error<IndexError>] {
    return stringify_node(document, document.root);
}

module edk.json.arena;

import edk.json.types.{JsonBoolRead, JsonDocument, JsonNode, JsonTextRead};



public flow empty_document() -> JsonDocument ![] {
    return JsonDocument { chunks = [], tail = [], full_chunks = 0, tail_size = 0, root = -1 };
}

public flow append(document: JsonDocument, item: JsonNode) -> JsonDocument ![] {
    if document.tail_size == 256 {
        return JsonDocument {
            chunks = document.chunks.push(document.tail),
            tail = [item],
            full_chunks = document.full_chunks + 1,
            tail_size = 1,
            root = document.root,
        };
    }
    return JsonDocument {
        chunks = document.chunks,
        tail = document.tail.push(item),
        full_chunks = document.full_chunks,
        tail_size = document.tail_size + 1,
        root = document.root,
    };
}

public flow with_root(document: JsonDocument, root: i32) -> JsonDocument ![] {
    return JsonDocument {
        chunks = document.chunks,
        tail = document.tail,
        full_chunks = document.full_chunks,
        tail_size = document.tail_size,
        root = root,
    };
}

public flow node(document: JsonDocument, id: i32) -> JsonNode ![Error<IndexError>] {
    let full_size = document.full_chunks * 256;
    if id < full_size {
        let chunk = document.chunks[id / 256];
        return chunk[id - (id / 256) * 256];
    }
    return document.tail[id - full_size];
}

public flow child(document: JsonDocument, parent: i32, index: i32) -> JsonNode ![Error<IndexError>] {
    let parent_node = node(document, parent);
    return node(document, parent_node.children[index]);
}

public flow child_id(document: JsonDocument, parent: i32, index: i32) -> i32 ![Error<IndexError>] {
    let parent_node = node(document, parent);
    return parent_node.children[index];
}

public flow field(document: JsonDocument, parent: i32, key: string) -> JsonNode ![Error<IndexError>] {
    let parent_node = node(document, parent);
    if parent_node.kind != "object" {
        return JsonNode { kind = "missing", key = key, text = "", children = [] };
    }
    for child_id in parent_node.children limit Iterations(65536) {
        let child = node(document, child_id);
        if child.key == key {
            return child;
        }
    }
    return JsonNode { kind = "missing", key = key, text = "", children = [] };
}

public flow make_string(value: string) -> JsonNode ![] {
    return JsonNode { kind = "string", key = "", text = value, children = [] };
}

public flow make_number(raw: string) -> JsonNode ![] {
    return JsonNode { kind = "number", key = "", text = raw, children = [] };
}

public flow make_bool(value: bool) -> JsonNode ![] {
    let raw = if value { "true" } else { "false" };
    return JsonNode { kind = "bool", key = "", text = raw, children = [] };
}

public flow make_null() -> JsonNode ![] {
    return JsonNode { kind = "null", key = "", text = "null", children = [] };
}

public flow make_array(children: Array<i32>) -> JsonNode ![] {
    return JsonNode { kind = "array", key = "", text = "", children = children };
}

public flow make_object(children: Array<i32>) -> JsonNode ![] {
    return JsonNode { kind = "object", key = "", text = "", children = children };
}

public flow is_missing(item: JsonNode) -> bool ![] {
    return item.kind == "missing";
}

public flow read_string(item: JsonNode) -> JsonTextRead ![] {
    if item.kind == "string" {
        return JsonTextRead { ok = true, value = item.text };
    }
    return JsonTextRead { ok = false, value = "" };
}

public flow read_number(item: JsonNode) -> JsonTextRead ![] {
    if item.kind == "number" {
        return JsonTextRead { ok = true, value = item.text };
    }
    return JsonTextRead { ok = false, value = "" };
}

public flow read_bool(item: JsonNode) -> JsonBoolRead ![] {
    if item.kind == "bool" {
        return JsonBoolRead { ok = true, value = item.text == "true" };
    }
    return JsonBoolRead { ok = false, value = false };
}

public flow is_null(item: JsonNode) -> bool ![] {
    return item.kind == "null";
}

module edk.json.types;

public type JsonNode = {
    kind: string,
    key: string,
    text: string,
    children: Array<i32>,
};

public type JsonDocument = {
    chunks: Array<Array<JsonNode>>,
    tail: Array<JsonNode>,
    full_chunks: i32,
    tail_size: i32,
    root: i32,
};

public type JsonTextRead = {
    ok: bool,
    value: string,
};

public type JsonBoolRead = {
    ok: bool,
    value: bool,
};

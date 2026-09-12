module edk.json.util;

import edk.json.types.JsonNode;
public flow count_chars(parts: Array<string>) -> i32 ![] {
    var count = 0;
    for part in parts limit Iterations(20000000) {
        if part != "" {
            count = count + 1;
        }
    }
    return count;
}

public flow node_count(nodes: Array<JsonNode>) -> i32 ![] {
    var count = 0;
    for item in nodes limit Iterations(20000000) {
        count = count + 1;
    }
    return count;
}

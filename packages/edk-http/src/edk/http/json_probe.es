module edk.http.json_probe;

import std.json.{JsonError, JsonValue, parse, stringify};

flow parse_probe(input: string) -> Result<JsonValue, JsonError> ![] {
    return parse(input);
}

flow stringify_probe(value: JsonValue) -> Result<string, JsonError> ![] {
    return stringify(value);
}

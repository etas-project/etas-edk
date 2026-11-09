module edk.json.reader_probe;

import std.text.split;
import edk.json.reader.{array_reader, next_item};
import edk.json.serializer.stringify;

flow bs() -> string ![Error<IndexError>] {
    return split("\\", "")[1];
}

flow check(input: string, expected: Array<string>, count: i32) ->
    i32 ![Error<IndexError>] {
    var reader = array_reader(input);
    var seen = 0;
    while true limit Iterations(20000000) {
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
    while steps < 8 limit Iterations(16) {
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

public flow main() -> i32 ![Error<IndexError>] {
    if check("[1,{\"a\":[true,null]},\"x\"]",
        ["1", "{\"a\":[true,null]}", "\"x\""], 3) != 0 {
        return 10;
    }
    if check("[\n  {\"a\": [\n    1,\n    2\n  ]},\n  true\n]",
        ["{\"a\":[1,2]}", "true"], 2) != 0 {
        return 11;
    }
    if check("[1,2,true,null,\"x\"]",
        ["1", "2", "true", "null", "\"x\""], 5) != 0 {
        return 12;
    }
    if check(" \n [ \n ] \n", [], 0) != 0 {
        return 13;
    }
    if check("[\"a" + bs() + bs() + bs() + "\"b\", \"c\"]",
        ["\"a" + bs() + bs() + bs() + "\"b\"", "\"c\""], 2) != 0 {
        return 14;
    }
    if check_error("[1,]") != 0 {
        return 20;
    }
    if check_error("[1] trailing") != 0 {
        return 21;
    }
    if check_error("[] trailing") != 0 {
        return 28;
    }
    if check_error("[{\"a\":\n 1}") != 0 {
        return 22;
    }
    if check_error("[\"a\nb\"]") != 0 {
        return 23;
    }
    if check_error("[1,") != 0 {
        return 24;
    }
    if check_error("[1\n2]") != 0 {
        return 25;
    }
    if check_error("[tr\nue]") != 0 {
        return 29;
    }
    if check_end_repeat() != 0 {
        return 26;
    }
    if check_early_stop() != 0 {
        return 27;
    }
    return 0;
}

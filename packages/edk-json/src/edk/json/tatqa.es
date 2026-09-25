module edk.json.tatqa;

import std.io.{IOError as IoError, eprintln, println, read_all};
import std.bytes.len as bytes_len;
import std.codec.text.{Strict, utf8_decode};
import std.fs.{IOError, Region, WorkspacePath, path, read_bytes};
import std.text.{split, to_string_i32, to_string_usize, trim};
import edk.json.parser.parse;
import edk.json.reader.{array_reader, next_item};
import edk.json.probe.{main as probe_main};
import edk.json.serializer.stringify;
import edk.json.types.{JsonDocument, JsonNode};
import edk.json.arena.node;

type MaterialRoot;
impl MaterialRoot ~ Region;

public type Stats = {
    nodes: i32,
    objects: i32,
    arrays: i32,
    strings: i32,
    numbers: i32,
    bools: i32,
    nulls: i32,
    bad: i32,
};

flow empty_stats() -> Stats ![] {
    return Stats { nodes = 0, objects = 0, arrays = 0, strings = 0, numbers = 0, bools = 0, nulls = 0, bad = 0 };
}

flow add(left: Stats, right: Stats) -> Stats ![] {
    return Stats {
        nodes = left.nodes + right.nodes,
        objects = left.objects + right.objects,
        arrays = left.arrays + right.arrays,
        strings = left.strings + right.strings,
        numbers = left.numbers + right.numbers,
        bools = left.bools + right.bools,
        nulls = left.nulls + right.nulls,
        bad = left.bad + right.bad,
    };
}

flow visit(document: JsonDocument, id: i32) -> Stats ![Error<IndexError>] {
    let item = node(document, id);
    var out = empty_stats();
    if item.kind == "object" {
        out = Stats { nodes = 1, objects = 1, arrays = 0, strings = 0, numbers = 0, bools = 0, nulls = 0, bad = 0 };
    } else if item.kind == "array" {
        out = Stats { nodes = 1, objects = 0, arrays = 1, strings = 0, numbers = 0, bools = 0, nulls = 0, bad = 0 };
    } else if item.kind == "string" {
        out = Stats { nodes = 1, objects = 0, arrays = 0, strings = 1, numbers = 0, bools = 0, nulls = 0, bad = 0 };
    } else if item.kind == "number" {
        out = Stats { nodes = 1, objects = 0, arrays = 0, strings = 0, numbers = 1, bools = 0, nulls = 0, bad = 0 };
    } else if item.kind == "bool" {
        out = Stats { nodes = 1, objects = 0, arrays = 0, strings = 0, numbers = 0, bools = 1, nulls = 0, bad = 0 };
    } else if item.kind == "null" {
        out = Stats { nodes = 1, objects = 0, arrays = 0, strings = 0, numbers = 0, bools = 0, nulls = 1, bad = 0 };
    } else {
        out = Stats { nodes = 1, objects = 0, arrays = 0, strings = 0, numbers = 0, bools = 0, nulls = 0, bad = 1 };
    }
    for child_id in item.children limit Iterations(20000000) {
        let child = node(document, child_id);
        let child_stats = visit(document, child_id);
        out = add(out, child_stats);
        if item.kind == "array" && child.key != "" {
            out = Stats { nodes = out.nodes, objects = out.objects, arrays = out.arrays, strings = out.strings, numbers = out.numbers, bools = out.bools, nulls = out.nulls, bad = out.bad + 1 };
        }
    }
    return out;
}

flow child_count(item: JsonNode) -> i32 ![] {
    var count = 0;
    for child_id in item.children limit Iterations(20000000) {
        count = count + 1;
    }
    return count;
}

flow validate_reader(input: string, expected_groups: i32, expected_nodes: i32, expected_objects: i32, expected_arrays: i32, expected_strings: i32, expected_numbers: i32, expected_bools: i32) -> i32 ![Error<IoError>, Error<IndexError>] {
    var reader = array_reader(input);
    var count = 0;
    var stats = empty_stats();
    while true limit Iterations(20000000) {
        let result = next_item(reader);
        if result.ok {
            let item_stats = visit(result.item, result.item.root);
            stats = add(stats, item_stats);
            count = count + 1;
            reader = result.reader;
            continue;
        }
        if result.end {
            if count != expected_groups || stats.nodes != expected_nodes || stats.objects != expected_objects || stats.arrays != expected_arrays || stats.strings != expected_strings || stats.numbers != expected_numbers || stats.bools != expected_bools || stats.nulls != 0 || stats.bad != 0 {
                return 7;
            }
            return 0;
        }
        eprintln(result.error);
        return 8;
    }
}

flow emit_reader(input: string) -> i32 ![Error<IoError>, Error<IndexError>] {
    var reader = array_reader(input);
    var count = 0;
    while true limit Iterations(20000000) {
        let result = next_item(reader);
        if result.ok {
            println(stringify(result.item));
            count = count + 1;
            reader = result.reader;
            continue;
        }
        if result.end {
            eprintln("EDK_READER_COMPLETE");
            return 0;
        }
        eprintln(result.error);
        return 9;
    }
}

flow material_path(name: string) -> Result<WorkspacePath<MaterialRoot>, IOError> ![] {
    return path<MaterialRoot>(name);
}

flow files_main(mode: string) -> i32 ![Error<IoError>, Error<IOError>, Error<IndexError>] {
    let names = split(read_all(), "\n");
    var files = 0;
    var total_bytes: usize = 0;
    for raw_name in names limit Iterations(20000000) {
        let name = trim(raw_name);
        if name == "" {
            continue;
        }
        let located = material_path(name);
        let target = match located {
            Ok(value) => value,
            Err(_) => {
                eprintln("EDK_FILES_PATH_ERROR");
                return 7;
            }
        };
        let bytes = read_bytes(target);
        total_bytes = total_bytes + bytes_len(bytes);
        let decoded = match utf8_decode(bytes, Strict) {
            Ok(value) => value,
            Err(_) => {
                eprintln("EDK_FILES_UTF8_ERROR");
                return 8;
            }
        };
        if mode == "files-json" {
            let parsed = parse(decoded);
            if !parsed.cursor.ok {
                eprintln("EDK_FILES_PARSE_ERROR");
                return 9;
            }
            println(stringify(parsed.cursor.document));
        }
        files = files + 1;
    }
    if mode == "files-json" {
        eprintln("EDK_FILES_COMPLETE files=" + to_string_i32(files));
    } else {
        println("{\"files\":" + to_string_i32(files) + ",\"bytes\":" + to_string_usize(total_bytes) + "}");
        eprintln("EDK_FILES_READ_COMPLETE");
    }
    return 0;
}

public flow files(args: Array<string>) -> i32 ![Error<IoError>, Error<IOError>, Error<IndexError>] {
    let mode = args[0];
    if mode == "files-json" || mode == "files-read" {
        return files_main(mode);
    }
    return 6;
}

public flow main(args: Array<string>) -> i32 ![Error<IoError>, Error<IndexError>] {
    let mode = args[0];
    if mode == "probe" {
        return probe_main(args);
    }
    let input = read_all();
    if mode == "reader-dev" {
        return validate_reader(input, 278, 40712, 3580, 6121, 25601, 3742, 1668);
    }
    if mode == "reader-train" {
        return validate_reader(input, 2201, 322003, 28136, 47913, 203463, 29276, 13215);
    }
    if mode == "reader-json" {
        return emit_reader(input);
    }
    let parsed = parse(input);
    if !parsed.cursor.ok {
        eprintln(parsed.cursor.error);
        return 2;
    }
    let document = parsed.cursor.document;
    if mode == "smoke" {
        println(stringify(document));
        return 0;
    }
    let root = node(document, document.root);
    if root.kind != "array" {
        return 3;
    }
    let stats = visit(document, document.root);
    if mode == "train" {
        if child_count(root) != 2201 || stats.nodes != 322004 || stats.objects != 28136 || stats.arrays != 47914 || stats.strings != 203463 || stats.numbers != 29276 || stats.bools != 13215 || stats.nulls != 0 || stats.bad != 0 {
            return 4;
        }
        println(stringify(document));
        return 0;
    }
    if mode == "dev" {
        if child_count(root) != 278 || stats.nodes != 40713 || stats.objects != 3580 || stats.arrays != 6122 || stats.strings != 25601 || stats.numbers != 3742 || stats.bools != 1668 || stats.nulls != 0 || stats.bad != 0 {
            return 5;
        }
        println(stringify(document));
        return 0;
    }
    return 6;
}

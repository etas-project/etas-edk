module edk.material.cli;

import std.io.{IOError as IoError, println, read_all};
import std.text.parse_i32;
import edk.json.serializer.stringify;
import edk.json.types.JsonDocument;
import edk.material.service.{DocumentResult, MaterialLoad, error_document,
    load_material, read, search};
import edk.material.number.{CellRef, calculate};

flow count_args(args: Array<string>) -> i32 ![] {
    var count = 0;
    for value in args limit Iterations(1024) { count = count + 1; }
    return count;
}

flow emit_document(document: JsonDocument) -> i32 ![Error<IndexError>, Error<IoError>] {
    println(stringify(document));
    return 0;
}

flow emit_load_error(loaded: MaterialLoad) -> i32 ![Error<IndexError>, Error<IoError>] {
    return emit_document(error_document(loaded.error.code, loaded.error.message));
}

flow emit_result(result: DocumentResult) -> i32 ![Error<IndexError>, Error<IoError>] {
    if result.ok { return emit_document(result.document); }
    return emit_document(error_document(result.error.code, result.error.message));
}

public flow main(args: Array<string>) -> i32 ![Error<IndexError>, Error<IoError>] {
    let count = count_args(args);
    if count == 0 {
        println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"use search, read or calculate\"}}");
        return 2;
    }
    let mode = args[0];
    let input = read_all();
    var material_id = "material";

    if mode == "search" {
        if count < 2 {
            println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"search requires query\"}}");
            return 2;
        }
        var limit = 20;
        if count >= 3 {
            match parse_i32(args[2]) {
                Ok(value) => { limit = value; }
                Err(_) => {
                    println("{\"ok\":false,\"error\":{\"code\":\"invalid-limit\",\"message\":\"limit must be an integer\"}}");
                    return 2;
                }
            }
        }
        if count >= 4 { material_id = args[3]; }
        let loaded = load_material(input, material_id);
        if !loaded.ok { return emit_load_error(loaded); }
        return emit_result(search(loaded.material, args[1], limit));
    }

    if mode == "read" {
        if count < 3 {
            println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"read requires kind and id\"}}");
            return 2;
        }
        let kind = args[1];
        let id = args[2];
        var row = -1;
        var column = -1;
        if kind == "row" {
            if count < 4 {
                println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"read row requires table uid and row\"}}");
                return 2;
            }
            match parse_i32(args[3]) {
                Ok(value) => { row = value; }
                Err(_) => {
                    println("{\"ok\":false,\"error\":{\"code\":\"invalid-row\",\"message\":\"row must be an integer\"}}");
                    return 2;
                }
            }
            if count >= 5 { material_id = args[4]; }
        } else if kind == "cell" {
            if count < 5 {
                println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"read cell requires table uid, row and column\"}}");
                return 2;
            }
            match parse_i32(args[3]) {
                Ok(value) => { row = value; }
                Err(_) => {
                    println("{\"ok\":false,\"error\":{\"code\":\"invalid-row\",\"message\":\"row must be an integer\"}}");
                    return 2;
                }
            }
            match parse_i32(args[4]) {
                Ok(value) => { column = value; }
                Err(_) => {
                    println("{\"ok\":false,\"error\":{\"code\":\"invalid-column\",\"message\":\"column must be an integer\"}}");
                    return 2;
                }
            }
            if count >= 6 { material_id = args[5]; }
        } else if kind == "paragraph" || kind == "table" {
            if count >= 4 { material_id = args[3]; }
        } else {
            println("{\"ok\":false,\"error\":{\"code\":\"invalid-request\",\"message\":\"read kind must be paragraph, table, row or cell\"}}");
            return 2;
        }
        let loaded = load_material(input, material_id);
        if !loaded.ok { return emit_load_error(loaded); }
        return emit_result(read(loaded.material, kind, id, row, column));
    }

    if mode == "calculate" {
        if count < 6 {
            println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"calculate requires operation, table uid, row/column/unit pairs\"}}");
            return 2;
        }
        if (count - 3) % 3 != 0 {
            println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"calculate references require row, column and unit triples\"}}");
            return 2;
        }
        let operation = args[1];
        let table_uid = args[2];
        var refs: Array<CellRef> = [];
        var units: Array<string> = [];
        var position = 3;
        while position + 2 < count limit Iterations(65536) {
            match parse_i32(args[position]) {
                Ok(row_value) => {
                    match parse_i32(args[position + 1]) {
                        Ok(column_value) => {
                            refs = refs.push(CellRef {
                                material = material_id, table = table_uid,
                                row = row_value, column = column_value,
                            });
                            units = units.push(args[position + 2]);
                        }
                        Err(_) => {
                            println("{\"ok\":false,\"error\":{\"code\":\"invalid-column\",\"message\":\"column must be an integer\"}}");
                            return 2;
                        }
                    }
                }
                Err(_) => {
                    println("{\"ok\":false,\"error\":{\"code\":\"invalid-row\",\"message\":\"row must be an integer\"}}");
                    return 2;
                }
            }
            position = position + 3;
        }
        let loaded = load_material(input, material_id);
        if !loaded.ok { return emit_load_error(loaded); }
        return emit_result(calculate(loaded.material, operation, refs, units));
    }

    println("{\"ok\":false,\"error\":{\"code\":\"usage\",\"message\":\"use search, read or calculate\"}}");
    return 2;
}

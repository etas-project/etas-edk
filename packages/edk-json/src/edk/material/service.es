module edk.material.service;

import std.text.{contains, join, lowercase, to_string_i32, trim};
import edk.json.arena.{append, empty_document, make_array, make_bool,
    make_number, make_object, make_string, node, with_root};
import edk.json.parser.parse;
import edk.json.types.{JsonDocument, JsonNode};

public type MaterialError = { code: string, message: string };
public type Paragraph = { uid: string, order_raw: string, text: string, source: string };
public type Table = { id: string, source: string, unit: string, cells: Array<Array<string>> };
public type Material = {
    material_id: string,
    provenance: string,
    canonical: bool,
    table_uid: string,
    table: Array<Array<string>>,
    table_uids: Array<string>,
    tables: Array<Table>,
    paragraphs: Array<Paragraph>,
};
public type MaterialLoad = { ok: bool, material: Material, error: MaterialError };
public type DocumentResult = {
    ok: bool,
    document: JsonDocument,
    error: MaterialError,
};
type TableResult = {
    ok: bool,
    table: Array<Array<string>>,
    error: MaterialError,
};
type ParagraphResult = {
    ok: bool,
    paragraphs: Array<Paragraph>,
    error: MaterialError,
};
type Lookup = { found: bool, index: i32 };
type BuildState = { document: JsonDocument, ids: Array<i32> };
type Built = { document: JsonDocument, id: i32 };

flow empty_error() -> MaterialError ![] {
    return MaterialError { code = "", message = "" };
}
flow empty_material() -> Material ![] {
    let table: Array<Array<string>> = [];
    let table_uids: Array<string> = [];
    let tables: Array<Table> = [];
    let paragraphs: Array<Paragraph> = [];
    return Material {
        material_id = "", provenance = "", canonical = false, table_uid = "", table = table, table_uids = table_uids, tables = tables, paragraphs = paragraphs,
    };
}
flow failed_load(code: string, message: string) -> MaterialLoad ![] {
    return MaterialLoad {
        ok = false, material = empty_material(),
        error = MaterialError { code = code, message = message },
    };
}
flow failed_document(code: string, message: string) -> DocumentResult ![Error<IndexError>] {
    return DocumentResult {
        ok = false, document = empty_document(),
        error = MaterialError { code = code, message = message },
    };
}

flow field_id(document: JsonDocument, parent: i32, key: string) -> i32
    ![Error<IndexError>] {
    let parent_node = node(document, parent);
    if parent_node.kind != "object" { return -1; }
    for child_id in parent_node.children limit Iterations(65536) {
        if node(document, child_id).key == key { return child_id; }
    }
    return -1;
}
flow optional_text(document: JsonDocument, parent: i32, key: string) -> string
    ![Error<IndexError>] {
    let id = field_id(document, parent, key);
    if id < 0 { return ""; }
    let value = node(document, id);
    if value.kind != "string" { return ""; }
    return value.text;
}
flow keyed(item: JsonNode, key: string) -> JsonNode ![] {
    return JsonNode {
        kind = item.kind, key = key, text = item.text, children = item.children,
    };
}
flow empty_state(document: JsonDocument) -> BuildState ![] {
    let ids: Array<i32> = [];
    return BuildState { document = document, ids = ids };
}
flow next_id(document: JsonDocument) -> i32 ![] {
    return document.full_chunks * 256 + document.tail_size;
}
flow append_keyed(state: BuildState, key: string, item: JsonNode)
    -> BuildState ![] {
    let id = next_id(state.document);
    return BuildState {
        document = append(state.document, keyed(item, key)),
        ids = state.ids.push(id),
    };
}
flow put_string(state: BuildState, key: string, value: string) -> BuildState ![] {
    return append_keyed(state, key, make_string(value));
}
flow put_number(state: BuildState, key: string, raw: string) -> BuildState ![] {
    return append_keyed(state, key, make_number(raw));
}
flow put_i32(state: BuildState, key: string, value: i32) -> BuildState ![] {
    return put_number(state, key, to_string_i32(value));
}
flow put_bool(state: BuildState, key: string, value: bool) -> BuildState ![] {
    return append_keyed(state, key, make_bool(value));
}
flow close_object(state: BuildState, key: string) -> Built ![] {
    let id = next_id(state.document);
    return Built {
        document = append(state.document, keyed(make_object(state.ids), key)),
        id = id,
    };
}
flow close_array(state: BuildState, key: string) -> Built ![] {
    let id = next_id(state.document);
    return Built {
        document = append(state.document, keyed(make_array(state.ids), key)),
        id = id,
    };
}
flow push_child(state: BuildState, child: Built) -> BuildState ![] {
    return BuildState {
        document = child.document, ids = state.ids.push(child.id),
    };
}
flow root_document(built: Built) -> JsonDocument ![] {
    return with_root(built.document, built.id);
}
flow success_root(state: BuildState) -> DocumentResult ![Error<IndexError>] {
    return DocumentResult {
        ok = true, document = root_document(close_object(state, "")),
        error = empty_error(),
    };
}

public flow error_document(code: string, message: string) -> JsonDocument ![] {
    var error_state = empty_state(empty_document());
    error_state = put_string(error_state, "code", code);
    error_state = put_string(error_state, "message", message);
    let error = close_object(error_state, "error");
    var root = empty_state(error.document);
    root = push_child(root, error);
    root = put_bool(root, "ok", false);
    return root_document(close_object(root, ""));
}

flow read_table(document: JsonDocument, table_id: i32) -> TableResult
    ![Error<IndexError>] {
    let empty: Array<Array<string>> = [];
    let table_node = node(document, table_id);
    if table_node.kind != "array" {
        return TableResult {
            ok = false, table = empty,
            error = MaterialError {
                code = "invalid-type", message = "table.table must be an array",
            },
        };
    }
    var result = empty;
    for row_id in table_node.children limit Iterations(65536) {
        let row_node = node(document, row_id);
        if row_node.kind != "array" {
            return TableResult {
                ok = false, table = empty,
                error = MaterialError {
                    code = "invalid-type",
                    message = "table.table rows must be arrays",
                },
            };
        }
        let values: Array<string> = [];
        var row = values;
        for cell_id in row_node.children limit Iterations(65536) {
            let cell = node(document, cell_id);
            if cell.kind != "string" {
                return TableResult {
                    ok = false, table = empty,
                    error = MaterialError {
                        code = "invalid-type",
                        message = "table.table cells must be strings",
                    },
                };
            }
            row = row.push(cell.text);
        }
        result = result.push(row);
    }
    return TableResult { ok = true, table = result, error = empty_error() };
}
flow has_uid(values: Array<string>, target: string) -> bool ![] {
    for value in values limit Iterations(65536) {
        if value == target { return true; }
    }
    return false;
}
flow read_paragraphs(document: JsonDocument, paragraphs_id: i32, canonical: bool)
    -> ParagraphResult ![Error<IndexError>] {
    let empty: Array<Paragraph> = [];
    let paragraphs_node = node(document, paragraphs_id);
    if paragraphs_node.kind != "array" {
        return ParagraphResult {
            ok = false, paragraphs = empty,
            error = MaterialError {
                code = "invalid-type", message = "paragraphs must be an array",
            },
        };
    }
    var result = empty;
    let seen: Array<string> = [];
    var seen_uids = seen;
    for paragraph_id in paragraphs_node.children limit Iterations(65536) {
        let paragraph_node = node(document, paragraph_id);
        if paragraph_node.kind != "object" {
            return ParagraphResult {
                ok = false, paragraphs = empty,
                error = MaterialError {
                    code = "invalid-type",
                    message = "paragraphs entries must be objects",
                },
            };
        }
        var uid_id = field_id(document, paragraph_id, "uid");
        if uid_id < 0 { uid_id = field_id(document, paragraph_id, "id"); }
        let order_id = field_id(document, paragraph_id, "order");
        let text_id = field_id(document, paragraph_id, "text");
        if uid_id < 0 || (!canonical && order_id < 0) || text_id < 0 {
            return ParagraphResult {
                ok = false, paragraphs = empty,
                error = MaterialError {
                    code = "missing-field",
                    message = "paragraph requires uid, order and text",
                },
            };
        }
        let uid = node(document, uid_id);
        var order = make_number("0");
        if order_id >= 0 { order = node(document, order_id); }
        let text = node(document, text_id);
        if uid.kind != "string" || order.kind != "number" ||
            text.kind != "string" {
            return ParagraphResult {
                ok = false, paragraphs = empty,
                error = MaterialError {
                    code = "invalid-type",
                    message = "paragraph uid/text must be strings and order a number",
                },
            };
        }
        if trim(uid.text) == "" {
            return ParagraphResult {
                ok = false, paragraphs = empty,
                error = MaterialError {
                    code = "invalid-value",
                    message = "paragraph uid must be non-empty",
                },
            };
        }
        if has_uid(seen_uids, uid.text) {
            return ParagraphResult {
                ok = false, paragraphs = empty,
                error = MaterialError {
                    code = "invalid-value",
                    message = "paragraph uid must be unique",
                },
            };
        }
        seen_uids = seen_uids.push(uid.text);
        result = result.push(Paragraph {
            uid = uid.text, order_raw = order.text, text = text.text,
            source = optional_text(document, paragraph_id, "source"),
        });
    }
    return ParagraphResult {
        ok = true, paragraphs = result, error = empty_error(),
    };
}
type TableEntry = { ok: bool, table: Table, error: MaterialError };

flow table_entry(document: JsonDocument, id: i32) -> TableEntry
    ![Error<IndexError>] {
    let empty: Array<Array<string>> = [];
    let blank = Table { id = "", source = "", unit = "", cells = empty };
    let item = node(document, id);
    if item.kind != "object" { return TableEntry { ok = false, table = blank, error = MaterialError { code = "invalid-type", message = "table entries must be objects" } }; }
    let id_id = field_id(document, id, "id");
    let uid_id = field_id(document, id, "uid");
    let data_id = field_id(document, id, "cells");
    if data_id < 0 { data_id = field_id(document, id, "table"); }
    if (id_id < 0 && uid_id < 0) || data_id < 0 { return TableEntry { ok = false, table = blank, error = MaterialError { code = "missing-field", message = "table requires id and cells" } }; }
    let id_node = node(document, if id_id >= 0 { id_id } else { uid_id });
    if id_node.kind != "string" || trim(id_node.text) == "" { return TableEntry { ok = false, table = blank, error = MaterialError { code = "invalid-value", message = "table id must be non-empty" } }; }
    let result = read_table(document, data_id);
    if result.ok == false { return TableEntry { ok = false, table = blank, error = result.error }; }
    var source = "";
    let source_id = field_id(document, id, "source");
    if source_id >= 0 { let source_node = node(document, source_id); if source_node.kind == "string" { source = source_node.text; } }
    var unit = "";
    let unit_id = field_id(document, id, "unit");
    if unit_id >= 0 { let unit_node = node(document, unit_id); if unit_node.kind == "string" { unit = unit_node.text; } }
    return TableEntry { ok = true, table = Table { id = id_node.text, source = source, unit = unit, cells = result.table }, error = empty_error() };
}

public flow load_material(input: string, material_id: string) -> MaterialLoad
    ![Error<IndexError>] {
    let parsed = parse(input);
    if !parsed.cursor.ok {
        return failed_load("invalid-json", parsed.cursor.error);
    }
    let document = parsed.cursor.document;
    let root = node(document, document.root);
    if root.kind != "object" {
        return failed_load("invalid-type", "material root must be an object");
    }
    let tables_id = field_id(document, document.root, "tables");
    if tables_id >= 0 {
        let tables_node = node(document, tables_id);
        let paragraphs_id = field_id(document, document.root, "paragraphs");
        if tables_node.kind != "array" || paragraphs_id < 0 { return failed_load("missing-field", "multi-table material requires tables and paragraphs"); }
        var uids: Array<string> = [];
        var all_tables: Array<Table> = [];
        var first_uid = "";
        var first_table: Array<Array<string>> = [];
        var table_index = 0;
        for entry_id in tables_node.children limit Iterations(256) {
            let entry = table_entry(document, entry_id);
            if !entry.ok { return failed_load(entry.error.code, entry.error.message); }
            for old_uid in uids limit Iterations(256) { if old_uid == entry.table.id { return failed_load("invalid-value", "table uid must be unique"); } }
            if table_index == 0 { first_uid = entry.table.id; first_table = entry.table.cells; }
            uids = uids.push(entry.table.id);
            all_tables = all_tables.push(entry.table);
            table_index = table_index + 1;
        }
        if table_index == 0 { return failed_load("invalid-value", "tables must not be empty"); }
        let paragraph_result = read_paragraphs(document, paragraphs_id, true);
        if !paragraph_result.ok { return failed_load(paragraph_result.error.code, paragraph_result.error.message); }
        let package_id = optional_text(document, document.root, "id");
        var id = material_id;
        if trim(id) == "" { id = package_id; }
        if package_id == "" || id != package_id { return failed_load("reference-mismatch", "canonical material id must match its package id"); }
        return MaterialLoad { ok = true, material = Material { material_id = id, provenance = optional_text(document, document.root, "provenance"), canonical = true, table_uid = first_uid, table = first_table, table_uids = uids, tables = all_tables, paragraphs = paragraph_result.paragraphs }, error = empty_error() };
    }
    let table_id = field_id(document, document.root, "table");
    let paragraphs_id = field_id(document, document.root, "paragraphs");
    if table_id < 0 || paragraphs_id < 0 {
        return failed_load("missing-field",
            "material requires table and paragraphs");
    }
    let table_node = node(document, table_id);
    if table_node.kind != "object" {
        return failed_load("invalid-type", "table must be an object");
    }
    let table_uid_id = field_id(document, table_id, "uid");
    let table_data_id = field_id(document, table_id, "table");
    if table_uid_id < 0 || table_data_id < 0 {
        return failed_load("missing-field", "table requires uid and table");
    }
    let table_uid_node = node(document, table_uid_id);
    if table_uid_node.kind != "string" {
        return failed_load("invalid-type", "table.uid must be a string");
    }
    if trim(table_uid_node.text) == "" {
        return failed_load("invalid-value", "table.uid must be non-empty");
    }
    let table_result = read_table(document, table_data_id);
    if !table_result.ok {
        return failed_load(table_result.error.code, table_result.error.message);
    }
    let paragraph_result = read_paragraphs(document, paragraphs_id, false);
    if !paragraph_result.ok {
        return failed_load(paragraph_result.error.code,
            paragraph_result.error.message);
    }
    var id = material_id;
    if trim(id) == "" { id = "material"; }
    return MaterialLoad {
        ok = true,
        material = Material {
            material_id = id, provenance = "", canonical = false, table_uid = table_uid_node.text,
            table = table_result.table, table_uids = [table_uid_node.text], tables = [Table { id = table_uid_node.text, source = "", unit = "", cells = table_result.table }], paragraphs = paragraph_result.paragraphs,
        },
        error = empty_error(),
    };
}
flow paragraph_index(material: Material, uid: string) -> Lookup ![] {
    var index = 0;
    for paragraph in material.paragraphs limit Iterations(65536) {
        if paragraph.uid == uid {
            return Lookup { found = true, index = index };
        }
        index = index + 1;
    }
    return Lookup { found = false, index = -1 };
}
flow paragraph_at(material: Material, target: i32) -> Paragraph ![] {
    var index = 0;
    for paragraph in material.paragraphs limit Iterations(65536) {
        if index == target { return paragraph; }
        index = index + 1;
    }
    return Paragraph { uid = "", order_raw = "0", text = "", source = "" };
}
flow source_paragraph(document: JsonDocument, material: Material, uid: string)
    -> Built ![] {
    var state = empty_state(document);
    state = put_string(state, "material", material.material_id);
    state = put_string(state, "paragraph", uid);
    for paragraph in material.paragraphs limit Iterations(65536) {
        if paragraph.uid == uid && paragraph.source != "" { state = put_string(state, "source", paragraph.source); }
    }
    if material.provenance != "" { state = put_string(state, "provenance", material.provenance); }
    return close_object(state, "source");
}
flow table_count(table: Array<Array<string>>) -> i32 ![] {
    var count = 0;
    for row in table limit Iterations(65536) { count = count + 1; }
    return count;
}
flow row_count(row: Array<string>) -> i32 ![] {
    var count = 0;
    for value in row limit Iterations(65536) { count = count + 1; }
    return count;
}
flow row_content(document: JsonDocument, row: Array<string>) -> Built ![] {
    var state = empty_state(document);
    for value in row limit Iterations(65536) {
        state = append_keyed(state, "", make_string(value));
    }
    return close_array(state, "values");
}
flow table_content(document: JsonDocument, table: Array<Array<string>>)
    -> Built ![] {
    var state = empty_state(document);
    for row in table limit Iterations(65536) {
        let built = row_content(state.document, row);
        state = push_child(state, built);
    }
    return close_array(state, "values");
}
flow paragraph_content(document: JsonDocument, paragraph: Paragraph) -> Built ![] {
    var state = empty_state(document);
    state = put_string(state, "uid", paragraph.uid);
    state = put_number(state, "order", paragraph.order_raw);
    state = put_string(state, "text", paragraph.text);
    return close_object(state, "paragraph");
}
flow read_table_record(material: Material, kind: string, row: i32, column: i32, table: Table)
    -> DocumentResult ![Error<IndexError>] {
    if kind != "table" && (row < 0 || row >= table_count(table.cells)) {
        return failed_document("out-of-range", "table row is out of range");
    }
    var values: Array<string> = [];
    if kind != "table" { values = row_at_table(table.cells, row); }
    if kind == "cell" && (column < 0 || column >= row_count(values)) {
        return failed_document("out-of-range", "table column is out of range");
    }
    var source_state = empty_state(empty_document());
    source_state = put_string(source_state, "material", material.material_id);
    source_state = put_string(source_state, "table", table.id);
    if kind != "table" { source_state = put_i32(source_state, "row", row); }
    if kind == "cell" { source_state = put_i32(source_state, "column", column); }
    if table.source != "" { source_state = put_string(source_state, "source", table.source); }
    if material.provenance != "" { source_state = put_string(source_state, "provenance", material.provenance); }
    let source = close_object(source_state, "source");
    var state = push_child(empty_state(source.document), source);
    state = put_bool(state, "ok", true);
    if table.unit != "" { state = put_string(state, "unit", table.unit); }
    if kind == "table" {
        state = put_string(state, "kind", "table");
        let content = table_content(state.document, table.cells);
        return success_root(push_child(state, content));
    }
    if kind == "row" {
        state = put_string(state, "kind", "table-row");
        let content = row_content(state.document, values);
        return success_root(push_child(state, content));
    }
    state = put_string(state, "kind", "table-cell");
    state = put_string(state, "value", values[column]);
    return success_root(state);
}
flow row_at_table(table: Array<Array<string>>, target: i32) -> Array<string> ![] {
    var index = 0;
    for values in table limit Iterations(65536) {
        if index == target { return values; }
        index = index + 1;
    }
    let empty: Array<string> = [];
    return empty;
}
public flow read(material: Material, kind: string, id: string, row: i32,
    column: i32) -> DocumentResult ![Error<IndexError>] {
    if trim(id) == "" { return failed_document("invalid-reference", "read requires a non-empty id"); }
    if kind == "paragraph" {
        let found = paragraph_index(material, id);
        if !found.found { return failed_document("not-found", "paragraph uid not found"); }
        var state = empty_state(empty_document());
        state = put_bool(state, "ok", true);
        state = put_string(state, "kind", "paragraph");
        let source = source_paragraph(state.document, material, id);
        state = push_child(state, source);
        let content = paragraph_content(state.document, paragraph_at(material, found.index));
        return success_root(push_child(state, content));
    }
    if kind != "table" && kind != "row" && kind != "cell" {
        return failed_document("invalid-request", "read kind must be paragraph, table, row or cell");
    }
    for table in material.tables limit Iterations(256) {
        if table.id == id { return read_table_record(material, kind, row, column, table); }
    }
    return failed_document("not-found", "table uid not found");
}
flow row_search_text(row: Array<string>) -> string ![] {
    return join(row, " ");
}
flow search_row_hit_uid(document: JsonDocument, material: Material, uid: string, source_name: string, row_number: i32, row: Array<string>) -> Built ![] {
    var state = empty_state(document);
    state = put_string(state, "kind", "table-row");
    state = put_string(state, "text", row_search_text(row));
    var source_state = empty_state(state.document);
    source_state = put_string(source_state, "material", material.material_id);
    source_state = put_string(source_state, "table", uid);
    if source_name != "" { source_state = put_string(source_state, "source", source_name); }
    if material.provenance != "" { source_state = put_string(source_state, "provenance", material.provenance); }
    source_state = put_i32(source_state, "row", row_number);
    let source = close_object(source_state, "source");
    state = push_child(state, source);
    return close_object(state, "");
}

flow search_paragraph_hit(document: JsonDocument, material: Material,
    paragraph: Paragraph) -> Built ![] {
    var state = empty_state(document);
    state = put_string(state, "kind", "paragraph");
    state = put_string(state, "text", paragraph.text);
    let source = source_paragraph(state.document, material, paragraph.uid);
    state = push_child(state, source);
    return close_object(state, "");
}
public flow search(material: Material, query: string, limit: i32)
    -> DocumentResult ![Error<IndexError>] {
    let needle = lowercase(trim(query));
    if needle == "" {
        return failed_document("invalid-query",
            "search query must be non-empty");
    }
    if limit <= 0 {
        return failed_document("invalid-limit",
            "search limit must be positive");
    }
    var state = empty_state(empty_document());
    var count = 0;
    var table_index = 0;
    for table in material.tables limit Iterations(256) {
        var row_number = 0;
        for row in table.cells limit Iterations(65536) {
            if count >= limit { break; }
            if contains(lowercase(row_search_text(row)), needle) {
                let hit = search_row_hit_uid(state.document, material, table.id, table.source, row_number, row);
                state = push_child(state, hit);
                count = count + 1;
            }
            row_number = row_number + 1;
        }
        table_index = table_index + 1;
        if count >= limit { break; }
    }
    for paragraph in material.paragraphs limit Iterations(65536) {
        if count >= limit { break; }
        if contains(lowercase(paragraph.text), needle) {
            let hit = search_paragraph_hit(state.document, material, paragraph);
            state = push_child(state, hit);
            count = count + 1;
        }
    }
    let matches = close_array(state, "matches");
    var result = empty_state(matches.document);
    result = push_child(result, matches);
    result = put_bool(result, "ok", true);
    result = put_string(result, "query", trim(query));
    result = put_i32(result, "count", count);
    return success_root(result);
}

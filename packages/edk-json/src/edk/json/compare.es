module edk.json.compare;

import std.text.contains;
import edk.json.binary64.{key as binary_key};
import edk.json.parser.parse;
import edk.json.arena.node;
import edk.json.types.JsonDocument;

flow count(values: Array<i32>) -> i32 ![] {
    var n = 0; for value in values limit Iterations(65536) { n = n + 1; } return n;
}
flow last(d: JsonDocument, parent: i32, key: string) -> i32 ![Error<IndexError>] {
    var found = -1;
    for child in node(d, parent).children limit Iterations(65536) {
        if node(d, child).key == key { found = child; }
    }
    return found;
}
flow floating(raw: string) -> bool ![] {
    return contains(raw, ".") || contains(raw, "e") || contains(raw, "E");
}
flow numbers(left: string, right: string) -> bool ![Error<IndexError>] {
    if floating(left) != floating(right) { return false; }
    if floating(left) {
        let a = binary_key(left); let b = binary_key(right);
        return a != "" && b != "" && a == b;
    }
    var a = left; var b = right;
    if a == "-0" { a = "0"; } if b == "-0" { b = "0"; }
    return a == b;
}
flow same(a: JsonDocument, ai: i32, b: JsonDocument, bi: i32) -> bool ![Error<IndexError>] {
    let av = node(a, ai); let bv = node(b, bi);
    if av.kind != bv.kind { return false; }
    if av.kind == "number" { return numbers(av.text, bv.text); }
    if av.kind == "array" {
        if count(av.children) != count(bv.children) { return false; }
        var index = 0;
        for child in av.children limit Iterations(65536) {
            if !same(a, child, b, bv.children[index]) { return false; }
            index = index + 1;
        }
        return true;
    }
    if av.kind == "object" {
        // Match Python json.loads: duplicate object keys use their last value.
        var ac = 0; var bc = 0;
        for child in av.children limit Iterations(65536) {
            let key = node(a, child).key;
            if last(a, ai, key) == child {
                ac = ac + 1; let other = last(b, bi, key);
                if other < 0 { return false; }
                if !same(a, child, b, other) { return false; }
            }
        }
        for child in bv.children limit Iterations(65536) {
            if last(b, bi, node(b, child).key) == child { bc = bc + 1; }
        }
        return ac == bc;
    }
    return av.text == bv.text;
}
// Keys are unordered; arrays/strings/types are exact. Keep integer lexemes out
// of std.json's f64 representation. Float lexemes alone use IEEE-754 decoding,
// retaining negative zero and Python's integer-versus-float distinction.
public flow equivalent(left: string, right: string) -> bool ![Error<IndexError>] {
    let a = parse(left); let b = parse(right);
    if !a.cursor.ok || !b.cursor.ok { return false; }
    return same(a.cursor.document, a.node_id, b.cursor.document, b.node_id);
}

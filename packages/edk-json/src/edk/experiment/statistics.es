module edk.experiment.statistics;

import std.text.{split, to_string_i32};

public type Integer = { ok: bool, value: i128 };
public type Summary = { ok: bool, count: i32, minimum: string, maximum: string, median: string, raw: string };

flow digit(c: string) -> i128 ![] {
    if c == "0" { return 0; } if c == "1" { return 1; }
    if c == "2" { return 2; } if c == "3" { return 3; }
    if c == "4" { return 4; } if c == "5" { return 5; }
    if c == "6" { return 6; } if c == "7" { return 7; }
    if c == "8" { return 8; } if c == "9" { return 9; }
    return -1;
}
public flow nonnegative(raw: string) -> Integer ![] {
    var n: i128 = 0; var size = 0;
    for c in split(raw, "") limit Iterations(65536) {
        if c != "" {
            size = size + 1;
            if digit(c) < 0 || size > 30 { return Integer { ok = false, value = 0 }; }
            n = n * 10 + digit(c);
        }
    }
    return Integer { ok = size > 0, value = n };
}
flow letter(n: i128) -> string ![] {
    if n == 0 { return "0"; } if n == 1 { return "1"; }
    if n == 2 { return "2"; } if n == 3 { return "3"; }
    if n == 4 { return "4"; } if n == 5 { return "5"; }
    if n == 6 { return "6"; } if n == 7 { return "7"; }
    if n == 8 { return "8"; } return "9";
}
public flow decimal(value: i128) -> string ![] {
    if value == 0 { return "0"; }
    var n = value; var out = "";
    while n > 0 limit Iterations(40) { out = letter(n % 10) + out; n = n / 10; }
    return out;
}
public flow fraction(numerator: i32, denominator: i32) -> string ![] {
    if denominator <= 0 { return "null"; }
    let n = nonnegative(to_string_i32(numerator)).value;
    let d = nonnegative(to_string_i32(denominator)).value;
    var out = decimal(n / d) + "."; var remainder = n % d;
    var i = 0;
    while i < 6 limit Iterations(6) { remainder = remainder * 10; out = out + letter(remainder / d); remainder = remainder % d; i = i + 1; }
    return out;
}
public flow summarize(values: Array<string>) -> Summary ![Error<IndexError>] {
    var sorted: Array<i128> = []; var n = 0; var raw = "";
    for value in values limit Iterations(1024) {
        let parsed = nonnegative(value);
        if !parsed.ok { return Summary { ok = false, count = n, minimum = "", maximum = "", median = "", raw = "" }; }
        var next: Array<i128> = []; var inserted = false;
        for previous in sorted limit Iterations(1024) {
            if !inserted && parsed.value < previous { next = next.push(parsed.value); inserted = true; }
            next = next.push(previous);
        }
        if !inserted { next = next.push(parsed.value); }
        sorted = next;
        if raw != "" { raw = raw + ","; }
        raw = raw + decimal(parsed.value); n = n + 1;
    }
    if n == 0 { return Summary { ok = false, count = 0, minimum = "", maximum = "", median = "", raw = "[]" }; }
    var middle = decimal(sorted[n / 2]);
    if n % 2 == 0 {
        let sum = sorted[n / 2 - 1] + sorted[n / 2];
        middle = decimal(sum / 2);
        if sum % 2 != 0 { middle = middle + ".5"; }
    }
    return Summary { ok = true, count = n, minimum = decimal(sorted[0]), maximum = decimal(sorted[n - 1]), median = middle, raw = "[" + raw + "]" };
}

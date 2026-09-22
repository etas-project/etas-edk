module edk.json.binary64;

import std.text.{split, join, lowercase, parse_i32, to_string_i32, starts_with};

flow size(a: Array<i32>) -> i32 ![] { var n = 0; for x in a limit Iterations(20000000) { n = n + 1; } return n; }
flow strings(a: Array<string>) -> i32 ![] { var n = 0; for x in a limit Iterations(20000000) { n = n + 1; } return n; }
flow digit(c: string) -> i32 ![] {
    if c == "0" { return 0; } if c == "1" { return 1; } if c == "2" { return 2; } if c == "3" { return 3; }
    if c == "4" { return 4; } if c == "5" { return 5; } if c == "6" { return 6; } if c == "7" { return 7; }
    if c == "8" { return 8; } return 9;
}
flow compare(a: Array<i32>, b: Array<i32>) -> i32 ![Error<IndexError>] {
    let na = size(a); let nb = size(b); if na < nb { return -1; } if na > nb { return 1; }
    var i = 0; for x in a limit Iterations(20000000) {
        if x < b[i] { return -1; } if x > b[i] { return 1; } i = i + 1;
    }
    return 0;
}
flow double(a: Array<i32>) -> Array<i32> ![Error<IndexError>] {
    var out: Array<i32> = []; let n = size(a); if n == 0 { return [0]; }
    if a[0] >= 5 { out = out.push(1); }
    var i = 0;
    for value in a limit Iterations(20000000) {
        var carry = 0;
        if i + 1 < n { if a[i + 1] >= 5 { carry = 1; } }
        out = out.push((value * 2 + carry) % 10); i = i + 1;
    }
    return out;
}
flow subtract(a: Array<i32>, b: Array<i32>) -> Array<i32> ![Error<IndexError>] {
    var i = size(a) - 1; var j = size(b) - 1; var borrow = 0; var reversed: Array<i32> = [];
    while i >= 0 limit Iterations(20000000) {
        var v = a[i] - borrow; if j >= 0 { v = v - b[j]; }
        borrow = 0; if v < 0 { v = v + 10; borrow = 1; }
        reversed = reversed.push(v); i = i - 1; j = j - 1;
    }
    var out: Array<i32> = []; i = size(reversed) - 1; var started = false;
    while i >= 0 limit Iterations(20000000) {
        let v = reversed[i];
        if v != 0 || started { out = out.push(v); started = true; }
        i = i - 1;
    }
    if !started { return [0]; } return out;
}
flow letter(n: i128) -> string ![] {
    if n == 0 { return "0"; } if n == 1 { return "1"; } if n == 2 { return "2"; } if n == 3 { return "3"; }
    if n == 4 { return "4"; } if n == 5 { return "5"; } if n == 6 { return "6"; } if n == 7 { return "7"; }
    if n == 8 { return "8"; } return "9";
}
flow decimal(n: i128) -> string ![] {
    if n == 0 { return "0"; } var v = n; var out = "";
    while v > 0 limit Iterations(40) { out = letter(v % 10) + out; v = v / 10; } return out;
}
// Exact decimal rational -> binary64 round-to-nearest, ties-to-even.
// The key is an odd significand and a binary exponent, or signed zero/infinity.
// Used only after the JSON grammar has validated the number.
public flow key(raw: string) -> string ![Error<IndexError>] {
    var sign = "+"; if starts_with(raw, "-") { sign = "-"; }
    let pieces = split(lowercase(raw), "e"); let body = pieces[0]; var exponent = 0;
    if strings(pieces) == 2 {
        match parse_i32(pieces[1]) {
            Ok(value) => { exponent = value; }
            Err(_) => { if starts_with(pieces[1], "-") { exponent = -100000000; } else { exponent = 100000000; } }
        }
    }
    var digits: Array<i32> = []; var after_dot = false; var decimals = 0; var started = false;
    for c in split(body, "") limit Iterations(20000000) {
        if c == "." { after_dot = true; }
        else {
            if c != "" && c != "-" {
                if after_dot { decimals = decimals + 1; }
                let v = digit(c); if v != 0 || started { digits = digits.push(v); started = true; }
            }
        }
    }
    if !started { return sign + "0"; }
    // Avoid exponent arithmetic overflow, while preserving all finite/subnormal values.
    if exponent > 30000000 { return sign + "inf"; }
    if exponent < -30000000 { return sign + "0"; }
    let scale = exponent - decimals;
    let magnitude = size(digits) + scale - 1;
    if magnitude >= 310 { return sign + "inf"; }
    if magnitude <= -326 { return sign + "0"; }
    var numerator = digits; var denominator: Array<i32> = [1]; var i = 0;
    if scale >= 0 {
        while i < scale limit Iterations(20000000) { numerator = numerator.push(0); i = i + 1; }
    } else {
        while i < 0 - scale limit Iterations(20000000) { denominator = denominator.push(0); i = i + 1; }
    }
    var exponent2 = 0;
    while compare(numerator, denominator) < 0 limit Iterations(2048) {
        numerator = double(numerator); exponent2 = exponent2 - 1;
    }
    while compare(numerator, double(denominator)) >= 0 limit Iterations(2048) {
        denominator = double(denominator); exponent2 = exponent2 + 1;
    }
    if exponent2 > 1023 { return sign + "inf"; }
    if exponent2 < -1075 { return sign + "0"; }
    if exponent2 == -1075 {
        if compare(numerator, denominator) == 0 { return sign + "0"; }
        return sign + "1@-1074";
    }
    var bits = 52; var power = exponent2 - 52;
    if exponent2 < -1022 { bits = exponent2 + 1074; power = -1074; }
    var remainder = subtract(numerator, denominator); var significand: i128 = 1; i = 0;
    while i < bits limit Iterations(52) {
        remainder = double(remainder); significand = significand * 2;
        if compare(remainder, denominator) >= 0 { remainder = subtract(remainder, denominator); significand = significand + 1; }
        i = i + 1;
    }
    let halfway = compare(double(remainder), denominator);
    if halfway > 0 || (halfway == 0 && significand % 2 == 1) { significand = significand + 1; }
    if exponent2 == 1023 && significand == 9007199254740992 { return sign + "inf"; }
    while significand % 2 == 0 limit Iterations(54) { significand = significand / 2; power = power + 1; }
    return sign + decimal(significand) + "@" + to_string_i32(power);
}

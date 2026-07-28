module std_requirements.http.positive.http_text_decode_modes.main;

import std.codec.text.{Strict, Replace, utf8_decode, utf8_encode};

flow main(args: Array<string>) -> i32 ![] {
    let strict = match utf8_decode(utf8_encode("payload"), Strict) {
        Ok(text) => text,
        Err(_) => "",
    };
    let replace = match utf8_decode(utf8_encode("payload"), Replace) {
        Ok(text) => text,
        Err(_) => "",
    };
    if strict != "payload" { return 1; }
    if replace != "payload" { return 1; }
    return 0;
}

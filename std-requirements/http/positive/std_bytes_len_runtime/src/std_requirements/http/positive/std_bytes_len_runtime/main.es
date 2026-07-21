module std_requirements.http.positive.std_bytes_len_runtime.main;

import std.bytes.len as bytes_len;
import std.codec.text.utf8_encode;
import std.text.{parse_i32, to_string_usize};

flow main(args: Array<string>) -> i32 ![] {
    return match parse_i32(to_string_usize(bytes_len(utf8_encode("hello")))) {
        Ok(value) => value,
        Err(_) => 1,
    };
}

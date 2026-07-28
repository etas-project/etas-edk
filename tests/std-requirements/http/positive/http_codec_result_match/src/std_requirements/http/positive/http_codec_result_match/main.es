module std_requirements.http.positive.http_codec_result_match.main;

import std.codec.text.utf8_encode;
import std.http.codec.{MalformedMessage, decode_response};
import std.result.{Err, Ok};

flow status_or_zero(raw: bytes) -> i32 ![] {
    return match decode_response(raw) {
        Ok(response) => response.head.status,
        Err(err) => 0,
    };
}

flow malformed_or_zero(raw: bytes) -> i32 ![] {
    return match decode_response(raw) {
        Ok(response) => 0,
        Err(MalformedMessage) => 9,
        Err(err) => 0,
    };
}

flow main(args: Array<string>) -> i32 ![] {
    let ok = status_or_zero(utf8_encode("HTTP/1.1 200 OK\ncontent-type: text/plain\n\nhello"));
    let malformed = malformed_or_zero(utf8_encode("not http"));
    if ok != 200 { return 1; }
    if malformed != 9 { return 1; }
    return 0;
}

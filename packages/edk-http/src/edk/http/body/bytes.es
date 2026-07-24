module edk.http.body.bytes;

import std.bytes.len as bytes_len;
import std.codec.text.{Replace, utf8_decode};
import edk.http.types.{RequestBody, ResponseBody};

public flow bytes_request_body(media_type: string, raw: bytes) -> RequestBody ![] {
    return RequestBody { media_type = media_type, raw = raw, text = "", length_bytes = bytes_len(raw) };
}

public flow bytes_response_body(media_type: string, raw: bytes) -> ResponseBody ![] {
    let text = match utf8_decode(raw, Replace) {
        Ok(value) => value,
        Err(_) => "",
    };
    return ResponseBody { media_type = media_type, raw = raw, text = text };
}

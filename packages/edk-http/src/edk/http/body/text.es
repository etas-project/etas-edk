module edk.http.body.text;

import std.bytes.len as bytes_len;
import std.codec.text.utf8_encode;
import edk.http.types.{RequestBody, ResponseBody};

public flow text_request_body(media_type: string, text: string) -> RequestBody ![] {
    let raw = utf8_encode(text);
    return RequestBody {
        media_type = media_type,
        raw = raw,
        text = text,
        length_bytes = bytes_len(raw),
    };
}

public flow text_response_body(media_type: string, text: string) -> ResponseBody ![] {
    return ResponseBody { media_type = media_type, raw = utf8_encode(text), text = text };
}

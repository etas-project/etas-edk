module edk.http.body.text;

import std.codec.text.utf8_encode;
import std.text.len as text_len;
import edk.http.types.{RequestBody, ResponseBody};

public flow text_request_body(media_type: string, text: string) -> RequestBody ![] {
    return RequestBody {
        media_type = media_type,
        raw = utf8_encode(text),
        text = text,
        length_bytes = text_len(text),
    };
}

public flow text_response_body(media_type: string, text: string) -> ResponseBody ![] {
    return ResponseBody { media_type = media_type, raw = utf8_encode(text), text = text };
}

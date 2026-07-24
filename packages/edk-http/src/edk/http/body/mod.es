module edk.http.body;

import std.codec.text.{InvalidUtf8, Replace, Strict, utf8_decode};
import edk.http.body.bytes.bytes_request_body;
import edk.http.body.bytes.bytes_response_body;
import edk.http.body.text.text_request_body;
import edk.http.body.text.text_response_body;
import edk.http.errors.{HttpError, codec_error};
import edk.http.types.{RequestBody, ResponseBody};

public flow empty() -> RequestBody ![] {
    return text_request_body("", "");
}

public flow response_body(media_type: string, text: string) -> ResponseBody ![] {
    return text_response_body(media_type, text);
}

public flow bytes(media_type: string, raw: bytes) -> RequestBody ![] {
    return bytes_request_body(media_type, raw);
}

public flow response_bytes(media_type: string, raw: bytes) -> ResponseBody ![] {
    return bytes_response_body(media_type, raw);
}

public flow text(media_type: string, value: string) -> RequestBody ![] {
    return text_request_body(media_type, value);
}

public flow response_text(media_type: string, value: string) -> ResponseBody ![] {
    return text_response_body(media_type, value);
}

public flow decode_text_strict(body: ResponseBody) -> Result<string, HttpError> ![] {
    return match utf8_decode(body.raw, Strict) {
        Ok(text) => Ok(text),
        Err(InvalidUtf8) => Err(codec_error("HTTP response body is not valid UTF-8")),
        Err(_) => Err(codec_error("HTTP response body text decoding failed")),
    };
}

public flow decode_text_lossy(body: ResponseBody) -> string ![] {
    return match utf8_decode(body.raw, Replace) {
        Ok(text) => text,
        Err(_) => "",
    };
}

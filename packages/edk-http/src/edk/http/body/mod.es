module edk.http.body;

import edk.http.body.bytes.bytes_request_body;
import edk.http.body.bytes.bytes_response_body;
import edk.http.body.text.text_request_body;
import edk.http.body.text.text_response_body;
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

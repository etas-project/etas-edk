module edk.http.wire.body_limit;

import edk.http.types.{BodyLimit, RequestBody};

public flow is_body_within_limit(length_bytes: usize, limit: BodyLimit) -> bool ![] {
    return length_bytes <= limit.max_bytes;
}

public flow is_request_body_within_limit(body: RequestBody, limit: BodyLimit) -> bool ![] {
    return is_body_within_limit(body.length_bytes, limit);
}

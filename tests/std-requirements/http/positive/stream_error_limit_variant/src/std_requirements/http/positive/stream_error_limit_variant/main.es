module std_requirements.http.positive.stream_error_limit_variant.main;

import std.stream.StreamError;

flow classify_limit(err: StreamError) -> i32 ![] {
    let limit = StreamError.LimitExceeded;
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    return 0;
}

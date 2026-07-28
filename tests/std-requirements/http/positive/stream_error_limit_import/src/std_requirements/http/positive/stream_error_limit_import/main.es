module std_requirements.http.positive.stream_error_limit_import.main;

import std.stream.{LimitExceeded, StreamError};

flow classify_limit(err: StreamError) -> i32 ![] {
    return match err {
        LimitExceeded => 7,
        _ => 0,
    };
}

flow main(args: Array<string>) -> i32 ![] {
    return classify_limit(LimitExceeded);
}

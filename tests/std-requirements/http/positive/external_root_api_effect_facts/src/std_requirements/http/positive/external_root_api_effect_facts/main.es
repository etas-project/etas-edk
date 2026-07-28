module std_requirements.http.positive.external_root_api_effect_facts.main;

import std.codec.text.utf8_encode;
import edk.http.{get, post};
import edk.http.api.{get as api_get, post as api_post};
import edk.http.client.defaults.default_options;
import edk.http.errors.HttpError;
import edk.http.policy.EdkHttp;
import edk.http.types.{HttpResponse, RequestBody};

flow call_get() -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return get("https://example.com/status", default_options());
}

flow call_post() -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    let body = RequestBody {
        media_type = "text/plain",
        raw = utf8_encode("payload"),
        text = "payload",
        length_bytes = 7,
    };
    return post(
        "https://example.com/submit",
        body,
        default_options(),
    );
}

flow call_api_get() -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    return api_get("https://example.com/status", default_options());
}

flow call_api_post() -> HttpResponse ![EdkHttp.request, Error<HttpError>] {
    let body = RequestBody {
        media_type = "text/plain",
        raw = utf8_encode("payload"),
        text = "payload",
        length_bytes = 7,
    };
    return api_post(
        "https://example.com/submit",
        body,
        default_options(),
    );
}

flow main(args: Array<string>) -> i32 ![] {
    return 0;
}

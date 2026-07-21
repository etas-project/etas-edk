module tests.edk.negative.edk_web_public_http_url_result_not_bare_url.main;

import edk.http.url.https;
import edk.http.types.Url;
import edk.web.pure.canonical_url.canonical;

flow main(args: Array<string>) -> i32
{
    let checked = https("example.com", "/docs");
    let raw: Url = checked;
    let normalized = canonical(raw);
    return 0;
}

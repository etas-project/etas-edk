module edk.web.fetch;

import std.security.trust.Untrusted;
import std.text.{contains, trim};
import edk.http.types.{HttpResponse, Url};
import edk.web.effects.EdkWeb;
import edk.web.errors.FetchError;
import edk.web.types.{WebFetchOptions, WebPage};

public flow default_fetch_options() -> WebFetchOptions ![] {
    return WebFetchOptions {
        timeout_millis = 30000,
        max_bytes = 1048576,
        accept = "text/html",
    };
}

public flow fetch_options(timeout_millis: i32, max_bytes: i32, accept: string) -> WebFetchOptions ![] {
    return WebFetchOptions {
        timeout_millis = timeout_millis,
        max_bytes = max_bytes,
        accept = trim(accept),
    };
}

public flow is_valid_fetch_options(options: WebFetchOptions) -> bool ![] {
    return options.timeout_millis > 0
        && options.max_bytes > 0
        && options.max_bytes <= 10485760
        && options.accept != ""
        && !contains(options.accept, "\n")
        && !contains(options.accept, "\r");
}

public flow page_from_http(url: Url, response: HttpResponse) -> Untrusted<WebPage> ![] {
    let links: Array<Url> = [];
    let page = WebPage {
        url = url,
        status = response.status,
        media_type = response.body.media_type,
        title = "",
        body = response.body.text,
        links = links,
    };
    return Untrusted(page);
}

public flow fetch(url: Url) -> Untrusted<WebPage> ![EdkWeb.fetch, Error<FetchError>] {
    return perform EdkWeb.fetch(url);
}

module edk.web.pure.html_extract;

import std.text.{contains, lowercase, trim};
import edk.http.types.Url;
import edk.web.types.HtmlExtractResult;

public flow extract_text(title: string, body: string) -> HtmlExtractResult ![] {
    let links: Array<Url> = [];
    return HtmlExtractResult {
        title = trim(title),
        text = trim(body),
        links = links,
    };
}

public flow looks_like_html(media_type: string, body: string) -> bool ![] {
    let normalized_media = lowercase(media_type);
    let normalized_body = lowercase(body);
    return contains(normalized_media, "html")
        || contains(normalized_body, "<html")
        || contains(normalized_body, "<!doctype html");
}

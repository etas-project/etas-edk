module edk.web.trust;

import std.security.trust.Sanitized;
import std.text.{contains, lowercase};
import edk.http.types.Url;
import edk.web.types.SanitizedHtml;

public flow needs_sanitization(html: string) -> bool ![] {
    let normalized = lowercase(html);
    return contains(normalized, "<")
        || contains(normalized, "javascript:")
        || contains(normalized, "data:")
        || contains(normalized, "vbscript:")
        || contains(normalized, "onerror=")
        || contains(normalized, "onload=")
        || contains(normalized, "onclick=")
        || contains(normalized, "onmouseover=")
        || contains(normalized, "srcdoc=")
        || contains(normalized, "style=");
}

public flow sanitize_html(source_url: Url, html: string) -> SanitizedHtml ![] {
    if needs_sanitization(html) {
        return SanitizedHtml {
            html = Sanitized(""),
            source_url = source_url,
        };
    }
    return SanitizedHtml {
        html = Sanitized(html),
        source_url = source_url,
    };
}

public flow sanitized_text(html: SanitizedHtml) -> Sanitized<string> ![] {
    return html.html;
}

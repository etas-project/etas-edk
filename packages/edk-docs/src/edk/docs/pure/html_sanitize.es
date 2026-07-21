module edk.docs.pure.html_sanitize;

import std.text.{contains, lowercase};
import edk.docs.html.{sanitization_report, trusted_html_document};
import edk.docs.types.{HtmlDocument, SanitizationReport};

public flow needs_sanitization(html: string) -> bool ![] {
    return count_sanitization_findings(html) > 0;
}

public flow count_sanitization_findings(html: string) -> i32 ![] {
    let normalized = lowercase(html);
    var count = 0;
    if contains(normalized, "<") {
        count = count + 1;
    }
    if contains(normalized, "&lt;") || contains(normalized, "&#60;") || contains(normalized, "&#x3c;") {
        count = count + 1;
    }
    if contains(normalized, "javascript:") || contains(normalized, "data:text/html") {
        count = count + 1;
    }
    if contains(normalized, "data:") || contains(normalized, "vbscript:") {
        count = count + 1;
    }
    if contains(normalized, "onerror=") || contains(normalized, "onload=") || contains(normalized, "onclick=") || contains(normalized, "onmouseover=") {
        count = count + 1;
    }
    if contains(normalized, "srcdoc=") {
        count = count + 1;
    }
    if contains(normalized, "style=") {
        count = count + 1;
    }
    if contains(normalized, "expression(") {
        count = count + 1;
    }
    if contains(normalized, "<script") || contains(normalized, "<iframe") || contains(normalized, "<object") || contains(normalized, "<embed") {
        count = count + 1;
    }
    return count;
}

public flow sanitize(html: string) -> HtmlDocument ![] {
    if needs_sanitization(html) {
        return trusted_html_document("");
    }
    return trusted_html_document(html);
}

public flow report(html: string) -> SanitizationReport ![] {
    let findings = count_sanitization_findings(html);
    if findings > 0 {
        return sanitization_report(true, findings, "html markup or unsafe content removed");
    }
    return sanitization_report(false, 0, "plain text did not require sanitization");
}

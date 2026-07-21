module edk.docs.html;

import std.security.trust.Sanitized;
import edk.docs.markdown.empty_ast;
import edk.docs.types.{DocumentAst, HtmlDocument, SanitizationReport};

public flow trusted_html_document(html: string) -> HtmlDocument ![] {
    return HtmlDocument {
        html = Sanitized(html),
        sanitized_text = html,
        ast = empty_ast(),
    };
}

public flow trusted_html_with_ast(html: string, ast: DocumentAst) -> HtmlDocument ![] {
    return HtmlDocument {
        html = Sanitized(html),
        sanitized_text = html,
        ast = ast,
    };
}

public flow sanitization_report(changed: bool, removed_nodes: i32, message: string) -> SanitizationReport ![] {
    return SanitizationReport {
        changed = changed,
        removed_nodes = removed_nodes,
        message = message,
    };
}

module edk.docs.tools.convert;

import edk.docs.convert.convert as convert_flow;
import edk.docs.effects.EdkDocs;
import edk.docs.errors.DocsError;
import edk.docs.pure.html_sanitize.sanitize as sanitize_flow;
import edk.docs.pure.markdown_parse.parse_single_line;
import edk.docs.types.{DocumentFormat, DocumentInput, DocumentOutput, HtmlDocument, MarkdownDocument};

public tool convert_document(input: DocumentInput, target: DocumentFormat) -> DocumentOutput ![EdkDocs.convert, Error<DocsError>] {
    return convert_flow(input, target);
}

public tool extract_markdown_summary(line: string) -> MarkdownDocument ![] {
    return parse_single_line(line);
}

public tool sanitize_html(html: string) -> HtmlDocument ![] {
    return sanitize_flow(html);
}

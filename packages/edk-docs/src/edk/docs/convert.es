module edk.docs.convert;

import edk.docs.effects.EdkDocs;
import edk.docs.errors.DocsError;
import edk.docs.html.trusted_html_with_ast;
import edk.docs.types.{ConversionOptions, DocumentFormat, DocumentInput, DocumentOutput, HtmlDocument, MarkdownDocument, PlainTextDocument};
import edk.workspace.path.workspace_path;
import edk.workspace.types.WorkspaceRootPath;
import std.text.{contains, lowercase, trim};

public flow format(name: string, media_type: string) -> DocumentFormat ![] {
    return DocumentFormat {
        name = lowercase(trim(name)),
        media_type = lowercase(trim(media_type)),
    };
}

public flow markdown_format() -> DocumentFormat ![] {
    return format("markdown", "text/markdown");
}

public flow html_format() -> DocumentFormat ![] {
    return format("html", "text/html");
}

public flow plain_text_format() -> DocumentFormat ![] {
    return format("text", "text/plain");
}

public flow docx_format() -> DocumentFormat ![] {
    return format("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

public flow pdf_format() -> DocumentFormat ![] {
    return format("pdf", "application/pdf");
}

public flow is_supported_format(source: DocumentFormat) -> bool ![] {
    let name = lowercase(trim(source.name));
    return name == "markdown" || name == "html" || name == "text" || name == "docx" || name == "pdf";
}

flow is_safe_format_token(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, ":")
        && !contains(normalized, ";")
        && !contains(normalized, "@")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

flow is_safe_media_type(value: string) -> bool ![] {
    let normalized = lowercase(trim(value));
    return normalized != ""
        && contains(normalized, "/")
        && !contains(normalized, " ")
        && !contains(normalized, "\\")
        && !contains(normalized, ";")
        && !contains(normalized, "@")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

flow media_matches_format(source: DocumentFormat) -> bool ![] {
    let name = lowercase(trim(source.name));
    let media_type = lowercase(trim(source.media_type));
    if name == "markdown" {
        return media_type == "text/markdown";
    }
    if name == "html" {
        return media_type == "text/html";
    }
    if name == "text" {
        return media_type == "text/plain";
    }
    if name == "docx" {
        return media_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if name == "pdf" {
        return media_type == "application/pdf";
    }
    return false;
}

public flow is_valid_format(source: DocumentFormat) -> bool ![] {
    return is_supported_format(source)
        && is_safe_format_token(source.name)
        && is_safe_media_type(source.media_type)
        && media_matches_format(source);
}

public flow conversion_options(preserve_links: bool, sanitize_html: bool) -> ConversionOptions ![] {
    return ConversionOptions {
        preserve_links = preserve_links,
        sanitize_html = sanitize_html,
    };
}

public flow safe_conversion_options() -> ConversionOptions ![] {
    return conversion_options(true, true);
}

public flow document_input(path: WorkspaceRootPath, source: DocumentFormat, text: string) -> DocumentInput ![] {
    return DocumentInput {
        path = path,
        format = source,
        text = text,
    };
}

public flow document_output(path: WorkspaceRootPath, target: DocumentFormat, text: string) -> DocumentOutput ![] {
    return DocumentOutput {
        path = path,
        format = target,
        text = text,
    };
}

flow known_workspace_path(value: string) -> WorkspaceRootPath ![] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => error.path,
    };
}

public flow input_text(text: string, source: DocumentFormat) -> DocumentInput ![] {
    return document_input(known_workspace_path(""), source, text);
}

public flow is_valid_document_input(input: DocumentInput) -> bool ![] {
    return is_valid_format(input.format);
}

public flow is_valid_document_output(output: DocumentOutput) -> bool ![] {
    return is_valid_format(output.format);
}

public flow convert(input: DocumentInput, target: DocumentFormat) -> DocumentOutput ![EdkDocs.convert, Error<DocsError>] {
    return perform EdkDocs.convert(input, target);
}

public flow markdown_to_html(doc: MarkdownDocument) -> HtmlDocument ![EdkDocs.convert, Error<DocsError>] {
    let output = convert(input_text(doc.text, markdown_format()), html_format());
    return trusted_html_with_ast(output.text, doc.ast);
}

public flow html_to_text(doc: HtmlDocument) -> PlainTextDocument ![EdkDocs.convert, Error<DocsError>] {
    let output = convert(input_text(doc.sanitized_text, html_format()), plain_text_format());
    return PlainTextDocument { text = output.text };
}

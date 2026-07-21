module edk.pdf.citation;

import edk.pdf.effects.EdkPdf;
import edk.pdf.errors.PdfError;
import edk.pdf.types.{CitationRef, PdfDocument, PdfTextSpan};
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.types.WorkspaceRootPath;
import std.text.{contains, join, starts_with, to_string_i32, trim};

public flow citation_key(prefix: string, index: i32) -> string ![] {
    return join([prefix, to_string_i32(index)], "-");
}

public flow citation_from_span(key: string, span: PdfTextSpan) -> CitationRef ![] {
    return CitationRef {
        key = key,
        page = span.page,
        text = span.text,
    };
}

public flow citation_map(document: PdfDocument) -> Array<CitationRef> ![] {
    var citations: Array<CitationRef> = [];
    var index = 0;
    for page in document.pages limit Iterations(65536) {
        for span in page.text_spans limit Iterations(65536) {
            citations = citations.push(citation_from_span(citation_key("span", index), span));
            index = index + 1;
        }
    }
    return citations;
}

public flow count_citations(citations: Array<CitationRef>) -> i32 ![] {
    var count = 0;
    for citation in citations limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow is_valid_citation(citation: CitationRef) -> bool ![] {
    return is_safe_citation_key(citation.key)
        && citation.page > 0
        && trim(citation.text) != "";
}

public flow is_safe_citation_key(key: string) -> bool ![] {
    let value = trim(key);
    return value != ""
        && !contains(value, " ")
        && !contains(value, "/")
        && !contains(value, "\\")
        && !contains(value, ":")
        && !contains(value, "@")
        && !contains(value, ";")
        && !contains(value, "?")
        && !contains(value, "#")
        && !contains(value, "\t")
        && !contains(value, "\n")
        && !contains(value, "\r");
}

flow citation_key_seen(keys: Array<string>, key: string) -> bool ![] {
    for seen in keys limit Iterations(65536) {
        if seen == key {
            return true;
        }
    }
    return false;
}

public flow citation_keys_unique(citations: Array<CitationRef>) -> bool ![] {
    var keys: Array<string> = [];
    for citation in citations limit Iterations(65536) {
        if citation_key_seen(keys, citation.key) {
            return false;
        }
        keys = keys.push(citation.key);
    }
    return true;
}

public flow citation_page_in_document(document: PdfDocument, citation: CitationRef) -> bool ![] {
    for page in document.pages limit Iterations(65536) {
        if page.number == citation.page {
            return true;
        }
    }
    return false;
}

public flow citations_valid_for_document(document: PdfDocument, citations: Array<CitationRef>) -> bool ![] {
    if !citation_keys_unique(citations) {
        return false;
    }
    for citation in citations limit Iterations(65536) {
        if !is_valid_citation(citation) || !citation_page_in_document(document, citation) {
            return false;
        }
    }
    return true;
}

public flow citation_keys_prefixed(citations: Array<CitationRef>, prefix: string) -> bool ![] {
    let expected = trim(prefix);
    if !is_safe_citation_key(expected) {
        return false;
    }
    for citation in citations limit Iterations(65536) {
        if !starts_with(citation.key, expected) {
            return false;
        }
    }
    return true;
}

public flow citations(path: WorkspaceRootPath) -> Array<CitationRef> ![EdkPdf.read, EdkWorkspace.read, Error<PdfError>] {
    return citation_map(perform EdkPdf.read(path));
}

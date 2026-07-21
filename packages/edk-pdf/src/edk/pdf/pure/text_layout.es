module edk.pdf.pure.text_layout;

import edk.pdf.types.{PdfDocument, TextLayoutSummary};
import std.text.{contains, trim};

public flow summarize_layout(document: PdfDocument) -> TextLayoutSummary ![] {
    var pages = 0;
    var spans = 0;
    for page in document.pages limit Iterations(65536) {
        pages = pages + 1;
        for span in page.text_spans limit Iterations(65536) {
            spans = spans + 1;
        }
    }
    return TextLayoutSummary {
        page_count = pages,
        span_count = spans,
    };
}

public flow count_pages(document: PdfDocument) -> i32 ![] {
    return summarize_layout(document).page_count;
}

public flow count_text_spans(document: PdfDocument) -> i32 ![] {
    return summarize_layout(document).span_count;
}

public flow count_images(document: PdfDocument) -> i32 ![] {
    var count = 0;
    for page in document.pages limit Iterations(65536) {
        for image in page.images limit Iterations(65536) {
            count = count + 1;
        }
    }
    return count;
}

public flow count_outline_entries(document: PdfDocument) -> i32 ![] {
    var count = 0;
    for entry in document.outline limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow contains_text(document: PdfDocument, text: string) -> bool ![] {
    let needle = trim(text);
    if needle == "" {
        return false;
    }
    for page in document.pages limit Iterations(65536) {
        for span in page.text_spans limit Iterations(65536) {
            if contains(span.text, needle) {
                return true;
            }
        }
    }
    return false;
}

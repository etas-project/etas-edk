module edk.pdf.mocks.pdf;

import edk.pdf.extract.{empty_metadata, is_valid_metadata_text, pdf_metadata};
import edk.pdf.types.{PdfDocument, PdfImageRef, PdfMetadata, PdfOutline, PdfPage, PdfTextSpan};
import edk.workspace.types.WorkspaceRootPath;
import std.text.{contains, lowercase, split, starts_with, trim};

public flow text_span(page: i32, text: string, x: i32, y: i32, width: i32, height: i32) -> PdfTextSpan ![] {
    return PdfTextSpan {
        page = page,
        text = text,
        x = x,
        y = y,
        width = width,
        height = height,
    };
}

public flow image_ref(id: string, page: i32, media_type: string) -> PdfImageRef ![] {
    return PdfImageRef {
        id = trim(id),
        page = page,
        media_type = media_type,
    };
}

public flow pdf_page(number: i32, width: i32, height: i32, text_spans: Array<PdfTextSpan>, images: Array<PdfImageRef>) -> PdfPage ![] {
    return PdfPage {
        number = number,
        width = width,
        height = height,
        text_spans = text_spans,
        images = images,
    };
}

public flow outline_entry(title: string, page: i32, level: i32) -> PdfOutline ![] {
    return PdfOutline {
        title = title,
        page = page,
        level = level,
    };
}

public flow pdf_document(path: WorkspaceRootPath, metadata: PdfMetadata, pages: Array<PdfPage>, outline: Array<PdfOutline>) -> PdfDocument ![] {
    return PdfDocument {
        path = path,
        metadata = metadata,
        pages = pages,
        outline = outline,
    };
}

public flow is_valid_text_span(span: PdfTextSpan) -> bool ![] {
    return span.page > 0
        && trim(span.text) != ""
        && span.x >= 0
        && span.y >= 0
        && span.width > 0
        && span.height > 0;
}

public flow is_supported_image_media_type(media_type: string) -> bool ![] {
    let normalized = lowercase(trim(media_type));
    if !starts_with(normalized, "image/")
        || contains(normalized, " ")
        || contains(normalized, "\t")
        || contains(normalized, "\n")
        || contains(normalized, "\r")
        || contains(normalized, "?")
        || contains(normalized, "#")
        || contains(normalized, "@")
        || contains(normalized, ";")
    {
        return false;
    }
    var subtype = "";
    var first = true;
    for part in split(normalized, "image/") limit Iterations(4) {
        if first {
            first = false;
        } else {
            subtype = part;
        }
    }
    return subtype != ""
        && !contains(subtype, "/")
        && !contains(subtype, "\\");
}

flow is_safe_image_id(id: string) -> bool ![] {
    let value = trim(id);
    return value != ""
        && !contains(value, " ")
        && !contains(value, "/")
        && !contains(value, "\\")
        && !contains(value, ":")
        && !contains(value, "..")
        && !contains(value, "@")
        && !contains(value, "?")
        && !contains(value, "#")
        && !contains(value, "\t")
        && !contains(value, "\n")
        && !contains(value, "\r");
}

public flow is_valid_image_ref(image: PdfImageRef) -> bool ![] {
    return is_safe_image_id(image.id)
        && image.page > 0
        && is_supported_image_media_type(image.media_type);
}

public flow is_valid_page(page: PdfPage) -> bool ![] {
    if page.number <= 0 || page.width <= 0 || page.height <= 0 {
        return false;
    }
    for span in page.text_spans limit Iterations(65536) {
        if span.page != page.number || !is_valid_text_span(span) {
            return false;
        }
        if span.x + span.width > page.width || span.y + span.height > page.height {
            return false;
        }
    }
    for image in page.images limit Iterations(65536) {
        if image.page != page.number || !is_valid_image_ref(image) {
            return false;
        }
    }
    return true;
}

public flow is_valid_outline(outline: PdfOutline) -> bool ![] {
    return trim(outline.title) != ""
        && is_valid_metadata_text(outline.title)
        && outline.page > 0
        && outline.level > 0;
}

flow count_document_pages(document: PdfDocument) -> i32 ![] {
    var count = 0;
    for page in document.pages limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow document_has_page(document: PdfDocument, page_number: i32) -> bool ![] {
    for page in document.pages limit Iterations(65536) {
        if page.number == page_number {
            return true;
        }
    }
    return false;
}

flow page_number_seen(numbers: Array<i32>, page_number: i32) -> bool ![] {
    for seen in numbers limit Iterations(65536) {
        if seen == page_number {
            return true;
        }
    }
    return false;
}

public flow document_page_numbers_unique(document: PdfDocument) -> bool ![] {
    var seen: Array<i32> = [];
    for page in document.pages limit Iterations(65536) {
        if page_number_seen(seen, page.number) {
            return false;
        }
        seen = seen.push(page.number);
    }
    return true;
}

public flow is_valid_metadata(metadata: PdfMetadata) -> bool ![] {
    return metadata.page_count >= 0
        && is_valid_metadata_text(metadata.title)
        && is_valid_metadata_text(metadata.author);
}

public flow is_valid_document(document: PdfDocument) -> bool ![] {
    if !is_valid_metadata(document.metadata)
        || document.metadata.page_count != count_document_pages(document)
        || !document_page_numbers_unique(document)
    {
        return false;
    }
    for page in document.pages limit Iterations(65536) {
        if !is_valid_page(page) {
            return false;
        }
    }
    for outline in document.outline limit Iterations(65536) {
        if !is_valid_outline(outline) || !document_has_page(document, outline.page) {
            return false;
        }
    }
    return true;
}

public flow empty_document(path: WorkspaceRootPath) -> PdfDocument ![] {
    let pages: Array<PdfPage> = [];
    let outline: Array<PdfOutline> = [];
    return pdf_document(path, empty_metadata(), pages, outline);
}

public flow single_page_text_document(path: WorkspaceRootPath, title: string, text: string) -> PdfDocument ![] {
    let spans: Array<PdfTextSpan> = [text_span(1, text, 0, 0, 612, 20)];
    let images: Array<PdfImageRef> = [];
    let pages: Array<PdfPage> = [pdf_page(1, 612, 792, spans, images)];
    let outline: Array<PdfOutline> = [outline_entry(title, 1, 1)];
    return pdf_document(path, pdf_metadata(title, "", 1, false), pages, outline);
}

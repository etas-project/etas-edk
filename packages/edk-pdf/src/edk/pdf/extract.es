module edk.pdf.extract;

import std.text.{contains, trim};
import edk.pdf.effects.EdkPdf;
import edk.pdf.errors.PdfError;
import edk.pdf.types.{PdfDocument, PdfMetadata};
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.types.WorkspaceRootPath;

public flow pdf_metadata(title: string, author: string, page_count: i32, encrypted: bool) -> PdfMetadata ![] {
    return PdfMetadata {
        title = title,
        author = author,
        page_count = page_count,
        encrypted = encrypted,
    };
}

public flow empty_metadata() -> PdfMetadata ![] {
    return pdf_metadata("", "", 0, false);
}

public flow is_valid_metadata_text(value: string) -> bool ![] {
    let normalized = trim(value);
    return !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

public flow extract_text(path: WorkspaceRootPath) -> PdfDocument ![EdkPdf.read, EdkWorkspace.read, Error<PdfError>] {
    return perform EdkPdf.read(path);
}

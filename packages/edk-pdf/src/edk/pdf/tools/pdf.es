module edk.pdf.tools.pdf;

import edk.pdf.citation.citations as citations_flow;
import edk.pdf.effects.EdkPdf;
import edk.pdf.errors.PdfError;
import edk.pdf.extract.extract_text as extract_text_flow;
import edk.pdf.types.{CitationRef, PdfDocument};
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.types.WorkspaceRootPath;

public tool extract_pdf_text(path: WorkspaceRootPath) -> PdfDocument ![EdkPdf.read, EdkWorkspace.read, Error<PdfError>] {
    return extract_text_flow(path);
}

public tool pdf_citations(path: WorkspaceRootPath) -> Array<CitationRef> ![EdkPdf.read, EdkWorkspace.read, Error<PdfError>] {
    return citations_flow(path);
}

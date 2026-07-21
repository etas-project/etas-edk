module edk.pdf.pure.citation_map;

import edk.pdf.citation.citation_map;
import edk.pdf.types.{CitationRef, PdfDocument};

public flow build(document: PdfDocument) -> Array<CitationRef> ![] {
    return citation_map(document);
}

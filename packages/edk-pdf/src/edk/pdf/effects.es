module edk.pdf.effects;

import edk.pdf.types.PdfDocument;
import edk.workspace.types.WorkspaceRootPath;

public effect EdkPdf extends FileIO {
    action read(path: WorkspaceRootPath) -> PdfDocument;
}

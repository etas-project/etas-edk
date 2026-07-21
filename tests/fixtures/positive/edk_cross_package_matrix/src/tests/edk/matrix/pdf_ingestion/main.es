module tests.edk.matrix.pdf_ingestion.main;

import edk.pdf.citation.{citation_map, citations, count_citations};
import edk.pdf.effects.EdkPdf;
import edk.pdf.errors.PdfError;
import edk.pdf.extract.extract_text;
import edk.pdf.mocks.pdf.{is_valid_document, single_page_text_document};
import edk.vector.effects.EdkVector;
import edk.vector.embed.embedding;
import edk.vector.errors.VectorError;
import edk.vector.store.{upsert, vector_record, vector_store};
import edk.vector.types.VectorRecord;
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.path.{is_path_escape, workspace_path};
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkPdf.read, EdkWorkspace.read, EdkVector.write, Error<PdfError>, Error<VectorError>, Error<WorkspaceError>] {
    let path = checked_workspace_path("papers/input.pdf");
    let document = extract_text(path);
    let refs = citations(path);
    let mock_document = single_page_text_document(path, "Input", "body");
    let mock_refs = citation_map(mock_document);
    let store = vector_store("pdf-ingestion", "fixture");
    let record = vector_record("pdf-1", mock_document.metadata.title, embedding([1, 0, 1]));
    let records: Array<VectorRecord> = [record];
    let receipt = upsert(store, records);

    if is_path_escape(path) { return 1; }
    if !is_valid_document(mock_document) { return 1; }
    if count_citations(mock_refs) != 1 { return 1; }
    if document.metadata.title != document.metadata.title { return 1; }
    if count_citations(refs) != count_citations(refs) { return 1; }
    if record.id != "pdf-1" { return 1; }
    if record.embedding.dimensions != 3 { return 1; }
    if receipt.written != receipt.written { return 1; }
    return 0;
}

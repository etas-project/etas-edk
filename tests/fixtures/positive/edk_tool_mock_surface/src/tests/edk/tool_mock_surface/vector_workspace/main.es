module tests.edk.tool_mock_surface.vector_workspace.main;

import edk.vector.effects.{EdkEmbedding, EdkVector};
import edk.vector.embed.embedding_model;
import edk.vector.errors.{EmbeddingError, VectorError};
import edk.vector.mocks.store.fixture_record;
import edk.vector.pure.filter_match.{is_valid_filter, is_wildcard_filter, record_matches};
import edk.vector.store.{metadata, vector_filter, vector_query, vector_query_with_filter, vector_record_with_metadata, vector_store};
import edk.vector.tools.retrieve.{retrieve_context, search_vectors, upsert_document_chunks};
import edk.vector.types.VectorRecord;
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.mocks.filesystem.directory_entry;
import edk.workspace.glob.scope_matches;
import edk.workspace.path.{is_path_escape, path_scope, workspace_path};
import edk.workspace.tools.files.list_files;
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkEmbedding.embed, EdkVector.search, EdkVector.write, EdkWorkspace.list, Error<EmbeddingError>, Error<VectorError>, Error<WorkspaceError>] {
    let store = vector_store("fixture", "mock");
    let model = embedding_model("fixture-embedding", "mock", 3);
    let record = fixture_record("doc-1", "content");
    let tagged_record = vector_record_with_metadata("doc-2", "content", record.embedding, [metadata("kind", "doc")]);
    let filter = vector_filter("kind", "doc");
    let invalid_filter = vector_filter("", "doc");
    let query = vector_query_with_filter(record.embedding, "content", 3, filter);
    let records: Array<VectorRecord> = [record];
    let write_receipt = upsert_document_chunks(store, records);
    let retrieved = retrieve_context(store, "content", model, 3);
    let searched = search_vectors(store, query);
    let wildcard_query = vector_query(record.embedding, "content", 3);

    let root = checked_workspace_path("docs/");
    let scope = path_scope("docs/");
    let directory = directory_entry(root);
    let entries = list_files(root);

    if store.name != "fixture" { return 1; }
    if model.dimensions != 3 { return 1; }
    if !is_valid_filter(filter) { return 1; }
    if is_valid_filter(invalid_filter) { return 1; }
    if !record_matches(filter, tagged_record) { return 1; }
    if record_matches(invalid_filter, tagged_record) { return 1; }
    if !is_wildcard_filter(wildcard_query.filter) { return 1; }
    if is_path_escape(root) { return 1; }
    if !scope_matches(scope, root) { return 1; }
    if directory.kind != "directory" { return 1; }
    if write_receipt.written != write_receipt.written { return 1; }
    if retrieved.count != retrieved.count { return 1; }
    if searched.count != searched.count { return 1; }
    if entries != entries { return 1; }
    return 0;
}

module edk.vector.tools.retrieve;

import edk.vector.effects.{EdkEmbedding, EdkVector};
import edk.vector.errors.{EmbeddingError, VectorError};
import edk.vector.retrieve.retrieve;
import edk.vector.store.{search, upsert};
import edk.vector.types.{EmbeddingModelRef, VectorQuery, VectorRecord, VectorSearchResult, VectorStoreRef, VectorWriteReceipt};

public tool retrieve_context(store: VectorStoreRef, text: string, model: EmbeddingModelRef, top_k: i32) -> VectorSearchResult
    ![EdkEmbedding.embed, EdkVector.search, Error<EmbeddingError>, Error<VectorError>]
{
    return retrieve(store, text, model, top_k);
}

public tool search_vectors(store: VectorStoreRef, query: VectorQuery) -> VectorSearchResult ![EdkVector.search, Error<VectorError>] {
    return search(store, query);
}

public tool upsert_document_chunks(store: VectorStoreRef, records: Array<VectorRecord>) -> VectorWriteReceipt ![EdkVector.write, Error<VectorError>] {
    return upsert(store, records);
}

module edk.vector.retrieve;

import edk.vector.effects.{EdkEmbedding, EdkVector};
import edk.vector.embed.embed;
import edk.vector.errors.{EmbeddingError, VectorError};
import edk.vector.store.{search, vector_query};
import edk.vector.types.{EmbeddingModelRef, VectorSearchResult, VectorStoreRef};

public flow retrieve(store: VectorStoreRef, text: string, model: EmbeddingModelRef, top_k: i32) -> VectorSearchResult
    ![EdkEmbedding.embed, EdkVector.search, Error<EmbeddingError>, Error<VectorError>]
{
    let query_embedding = embed(model, text);
    return search(store, vector_query(query_embedding, text, top_k));
}

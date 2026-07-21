module edk.vector.effects;

import edk.vector.types.{Embedding, EmbeddingModelRef, VectorQuery, VectorRecord, VectorSearchResult, VectorStoreRef, VectorWriteReceipt};

public effect EdkVector extends Network {
    action search(store: VectorStoreRef, query: VectorQuery) -> VectorSearchResult;
    action write(store: VectorStoreRef, records: Array<VectorRecord>) -> VectorWriteReceipt;
}

public effect EdkEmbedding extends Agentic {
    action embed(model: EmbeddingModelRef, input: string) -> Embedding;
}

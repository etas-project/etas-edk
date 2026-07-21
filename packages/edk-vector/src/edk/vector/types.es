module edk.vector.types;

public type VectorStoreRef = {
    name: string,
    driver: string,
};

public type EmbeddingModelRef = {
    name: string,
    provider: string,
    dimensions: i32,
};

public alias Embedding = {
    values: Array<i32>,
    dimensions: i32,
};

public alias VectorMetadata = {
    key: string,
    value: string,
};

public alias VectorRecord = {
    id: string,
    text: string,
    embedding: Embedding,
    metadata: Array<VectorMetadata>,
};

public alias VectorFilter = {
    key: string,
    value: string,
};

public alias VectorQuery = {
    embedding: Embedding,
    text: string,
    top_k: i32,
    filter: VectorFilter,
};

public alias VectorSearchHit = {
    record: VectorRecord,
    score: i32,
};

public alias VectorSearchResult = {
    hits: Array<VectorSearchHit>,
    count: i32,
};

public alias VectorWriteReceipt = {
    store: VectorStoreRef,
    written: i32,
    message: string,
};

public alias ChunkingPolicy = {
    max_chars: usize,
    overlap_chars: usize,
};

public alias TextChunk = {
    index: i32,
    text: string,
};

public alias SimilarityScore = {
    compatible: bool,
    score: i32,
};

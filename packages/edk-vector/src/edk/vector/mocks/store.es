module edk.vector.mocks.store;

import edk.vector.embed.embedding;
import edk.vector.store.vector_record;
import edk.vector.types.{Embedding, VectorRecord, VectorSearchHit, VectorSearchResult, VectorStoreRef, VectorWriteReceipt};

public flow fixture_embedding(value: i32, dimensions: i32) -> Embedding ![] {
    var values: Array<i32> = [];
    var index = 0;
    while index < dimensions limit Iterations(65536) {
        values = values.push(value);
        index = index + 1;
    }
    return embedding(values);
}

public flow fixture_record(id: string, text: string) -> VectorRecord ![] {
    return vector_record(id, text, fixture_embedding(1, 3));
}

public flow empty_search_result() -> VectorSearchResult ![] {
    let hits: Array<VectorSearchHit> = [];
    return VectorSearchResult {
        hits = hits,
        count = 0,
    };
}

flow count_hits(hits: Array<VectorSearchHit>) -> i32 ![] {
    var total = 0;
    for hit in hits limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow search_hit(record: VectorRecord, score: i32) -> VectorSearchHit ![] {
    return VectorSearchHit {
        record = record,
        score = score,
    };
}

public flow search_result(hits: Array<VectorSearchHit>) -> VectorSearchResult ![] {
    return VectorSearchResult {
        hits = hits,
        count = count_hits(hits),
    };
}

public flow single_hit_result(record: VectorRecord, score: i32) -> VectorSearchResult ![] {
    return search_result([search_hit(record, score)]);
}

public flow write_receipt(store: VectorStoreRef, written: i32) -> VectorWriteReceipt ![] {
    return VectorWriteReceipt {
        store = store,
        written = written,
        message = "mock write accepted",
    };
}

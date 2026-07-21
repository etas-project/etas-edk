module edk.vector.store;

import std.text.{contains, trim};
import edk.vector.effects.EdkVector;
import edk.vector.errors.VectorError;
import edk.vector.pure.filter_match.is_valid_filter;
import edk.vector.pure.similarity.is_valid_embedding;
import edk.vector.types.{Embedding, VectorFilter, VectorMetadata, VectorQuery, VectorRecord, VectorSearchResult, VectorStoreRef, VectorWriteReceipt};

public flow vector_store(name: string, driver: string) -> VectorStoreRef ![] {
    return VectorStoreRef { name = trim(name), driver = trim(driver) };
}

public flow is_valid_store_ref(store: VectorStoreRef) -> bool ![] {
    return is_safe_store_token(store.name) && is_safe_store_token(store.driver);
}

flow is_safe_store_token(value: string) -> bool ![] {
    return value != ""
        && !contains(value, " ")
        && !contains(value, "/")
        && !contains(value, "\\")
        && !contains(value, ":")
        && !contains(value, "?")
        && !contains(value, "#")
        && !contains(value, "@")
        && !contains(value, "\t")
        && !contains(value, "\n")
        && !contains(value, "\r");
}

public flow metadata(key: string, value: string) -> VectorMetadata ![] {
    return VectorMetadata { key = trim(key), value = value };
}

public flow is_valid_metadata(item: VectorMetadata) -> bool ![] {
    return is_safe_metadata_key(item.key)
        && !contains(item.value, "\n")
        && !contains(item.value, "\r");
}

public flow empty_metadata() -> Array<VectorMetadata> ![] {
    let entries: Array<VectorMetadata> = [];
    return entries;
}

flow all_metadata_valid(entries: Array<VectorMetadata>) -> bool ![] {
    for item in entries limit Iterations(65536) {
        if !is_valid_metadata(item) {
            return false;
        }
    }
    return true;
}

public flow vector_record(id: string, text: string, embedding: Embedding) -> VectorRecord ![] {
    return VectorRecord {
        id = trim(id),
        text = text,
        embedding = embedding,
        metadata = empty_metadata(),
    };
}

public flow vector_record_with_metadata(id: string, text: string, embedding: Embedding, metadata: Array<VectorMetadata>) -> VectorRecord ![] {
    return VectorRecord {
        id = trim(id),
        text = text,
        embedding = embedding,
        metadata = metadata,
    };
}

public flow is_valid_vector_record(record: VectorRecord) -> bool ![] {
    return is_safe_record_id(record.id)
        && is_valid_embedding(record.embedding)
        && all_metadata_valid(record.metadata);
}

public flow no_filter() -> VectorFilter ![] {
    return VectorFilter { key = "", value = "" };
}

public flow vector_filter(key: string, value: string) -> VectorFilter ![] {
    return VectorFilter { key = trim(key), value = trim(value) };
}

public flow vector_query(embedding: Embedding, text: string, top_k: i32) -> VectorQuery ![] {
    return VectorQuery {
        embedding = embedding,
        text = text,
        top_k = top_k,
        filter = no_filter(),
    };
}

public flow vector_query_with_filter(embedding: Embedding, text: string, top_k: i32, filter: VectorFilter) -> VectorQuery ![] {
    return VectorQuery {
        embedding = embedding,
        text = text,
        top_k = top_k,
        filter = filter,
    };
}

public flow is_valid_vector_query(query: VectorQuery) -> bool ![] {
    return query.top_k > 0
        && query.top_k <= 1000
        && is_valid_embedding(query.embedding)
        && is_valid_filter(query.filter);
}

public flow record_compatible_with_query(query: VectorQuery, record: VectorRecord) -> bool ![] {
    return is_valid_vector_query(query)
        && is_valid_vector_record(record)
        && query.embedding.dimensions == record.embedding.dimensions;
}

public flow search(store: VectorStoreRef, query: VectorQuery) -> VectorSearchResult ![EdkVector.search, Error<VectorError>] {
    return perform EdkVector.search(store, query);
}

public flow upsert(store: VectorStoreRef, records: Array<VectorRecord>) -> VectorWriteReceipt ![EdkVector.write, Error<VectorError>] {
    return perform EdkVector.write(store, records);
}

flow is_safe_metadata_key(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, ":")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "@")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

flow is_safe_record_id(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, ":")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "@")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

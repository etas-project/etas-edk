module edk.vector.errors;

import edk.vector.types.{EmbeddingModelRef, VectorStoreRef};

public type VectorError = {
    kind: string,
    message: string,
};

public type EmbeddingError = {
    model: EmbeddingModelRef,
    message: string,
};

public type StoreError = {
    store: VectorStoreRef,
    message: string,
};

public type DimensionMismatchError = {
    left: i32,
    right: i32,
};

public type FilterError = {
    key: string,
    message: string,
};

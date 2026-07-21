module edk.vector.embed;

import std.text.{contains, trim};
import edk.vector.effects.EdkEmbedding;
import edk.vector.errors.EmbeddingError;
import edk.vector.pure.similarity.is_valid_embedding;
import edk.vector.types.{Embedding, EmbeddingModelRef};

public flow embedding(values: Array<i32>) -> Embedding ![] {
    var dimensions = 0;
    for value in values limit Iterations(65536) {
        dimensions = dimensions + 1;
    }
    return Embedding { values = values, dimensions = dimensions };
}

public flow embedding_model(name: string, provider: string, dimensions: i32) -> EmbeddingModelRef ![] {
    return EmbeddingModelRef {
        name = trim(name),
        provider = trim(provider),
        dimensions = dimensions,
    };
}

public flow is_valid_embedding_model(model: EmbeddingModelRef) -> bool ![] {
    return is_safe_model_token(model.name)
        && is_safe_model_token(model.provider)
        && model.dimensions > 0;
}

public flow embedding_matches_model(model: EmbeddingModelRef, value: Embedding) -> bool ![] {
    return is_valid_embedding_model(model)
        && is_valid_embedding(value)
        && model.dimensions == value.dimensions;
}

public flow embed(model: EmbeddingModelRef, input: string) -> Embedding ![EdkEmbedding.embed, Error<EmbeddingError>] {
    return perform EdkEmbedding.embed(model, input);
}

flow is_safe_model_token(value: string) -> bool ![] {
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

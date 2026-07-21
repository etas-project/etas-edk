module edk.vector.pure.similarity;

import edk.vector.types.{Embedding, SimilarityScore};

public flow count_i32(values: Array<i32>) -> i32 ![] {
    var total = 0;
    for value in values limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow same_dimensions(left: Embedding, right: Embedding) -> bool ![] {
    return is_valid_embedding(left)
        && is_valid_embedding(right)
        && left.dimensions == right.dimensions;
}

public flow is_valid_embedding(embedding: Embedding) -> bool ![] {
    return embedding.dimensions > 0
        && count_i32(embedding.values) == embedding.dimensions;
}

public flow dot_i32(left: Embedding, right: Embedding) -> SimilarityScore ![Error<IndexError>] {
    if !same_dimensions(left, right) {
        return SimilarityScore { compatible = false, score = 0 };
    }

    var index = 0;
    var score = 0;
    while index < left.dimensions limit Iterations(65536) {
        score = score + (left.values[index] * right.values[index]);
        index = index + 1;
    }

    return SimilarityScore { compatible = true, score = score };
}

public flow l1_distance_i32(left: Embedding, right: Embedding) -> SimilarityScore ![Error<IndexError>] {
    if !same_dimensions(left, right) {
        return SimilarityScore { compatible = false, score = 0 };
    }

    var index = 0;
    var distance = 0;
    while index < left.dimensions limit Iterations(65536) {
        let delta = left.values[index] - right.values[index];
        if delta < 0 {
            distance = distance - delta;
        } else {
            distance = distance + delta;
        }
        index = index + 1;
    }

    return SimilarityScore { compatible = true, score = distance };
}

public flow squared_l2_distance_i32(left: Embedding, right: Embedding) -> SimilarityScore ![Error<IndexError>] {
    if !same_dimensions(left, right) {
        return SimilarityScore { compatible = false, score = 0 };
    }

    var index = 0;
    var distance = 0;
    while index < left.dimensions limit Iterations(65536) {
        let delta = left.values[index] - right.values[index];
        distance = distance + (delta * delta);
        index = index + 1;
    }

    return SimilarityScore { compatible = true, score = distance };
}

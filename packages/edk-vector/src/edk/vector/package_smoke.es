module edk.vector.package_smoke;

import edk.vector.embed.{embedding, embedding_matches_model, embedding_model, is_valid_embedding_model};
import edk.vector.mocks.store.{empty_search_result, fixture_record, search_result, search_hit, single_hit_result, write_receipt};
import edk.vector.pure.chunking.{chunking_policy, default_chunking_policy, is_valid_chunking_policy, is_valid_line_chunking_policy, line_chunking_policy, line_chunks, line_chunks_with_policy};
import edk.vector.pure.filter_match.{is_valid_filter, is_wildcard_filter, record_matches};
import edk.vector.pure.similarity.{dot_i32, is_valid_embedding, l1_distance_i32, same_dimensions, squared_l2_distance_i32};
import edk.vector.store.{is_valid_store_ref, is_valid_vector_query, is_valid_vector_record, metadata, no_filter, record_compatible_with_query, vector_filter, vector_query_with_filter, vector_record_with_metadata, vector_store};
import edk.vector.types.{Embedding, TextChunk};

flow count_chunks(chunks: Array<TextChunk>) -> i32 ![] {
    var total = 0;
    for chunk in chunks limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

flow main(args: Array<string>) -> i32 ![Error<IndexError>] {
    let left = embedding([1, 2, 3]);
    let right = embedding([2, 2, 2]);
    let incompatible = embedding([1, 2]);
    let malformed = Embedding { values = [1, 2], dimensions = 3 };
    let score = dot_i32(left, right);
    let distance = l1_distance_i32(left, right);
    let squared_distance = squared_l2_distance_i32(left, right);
    let bad_score = dot_i32(left, incompatible);
    let bad_squared_distance = squared_l2_distance_i32(left, incompatible);
    let model = embedding_model("mock-embed", "edk-test", 3);
    let invalid_model = embedding_model("", "edk-test", 3);
    let bad_model_name = embedding_model("mock/embed", "edk-test", 3);
    let bad_model_provider = embedding_model("mock-embed", "edk:test", 3);
    let store = vector_store("docs", "memory");
    let slash_store = vector_store("docs/private", "memory");
    let backslash_store = vector_store("docs\\private", "memory");
    let colon_store = vector_store("docs:private", "memory");
    let space_store = vector_store("docs private", "memory");
    let at_driver_store = vector_store("docs", "mem@ory");
    let newline_driver_store = vector_store("docs", "mem\nory");
    let record = vector_record_with_metadata(
        "doc-1",
        "hello",
        left,
        [metadata("kind", "guide"), metadata("lang", "en")],
    );
    let invalid_record = vector_record_with_metadata("", "hello", left, [metadata("kind", "guide")]);
    let invalid_metadata_record = vector_record_with_metadata("doc-3", "hello", left, [metadata("", "guide")]);
    let space_record = vector_record_with_metadata("doc 3", "hello", left, [metadata("kind", "guide")]);
    let at_record = vector_record_with_metadata("doc@3", "hello", left, [metadata("kind", "guide")]);
    let path_record = vector_record_with_metadata("doc/3", "hello", left, [metadata("kind", "guide")]);
    let bad_metadata_key_record = vector_record_with_metadata("doc-4", "hello", left, [metadata("source/type", "guide")]);
    let bad_metadata_value_record = vector_record_with_metadata("doc-5", "hello", left, [metadata("kind", "guide\nx")]);
    let filter = vector_filter("kind", "guide");
    let wildcard = no_filter();
    let value_only_filter = vector_filter("", "guide");
    let bad_filter_key = vector_filter("source/type", "guide");
    let bad_filter_value = vector_filter("kind", "guide\nx");
    let query = vector_query_with_filter(right, "hello", 3, filter);
    let invalid_query = vector_query_with_filter(right, "hello", 0, filter);
    let oversized_query = vector_query_with_filter(right, "hello", 1001, filter);
    let bad_filter_query = vector_query_with_filter(right, "hello", 3, bad_filter_key);
    let chunks = line_chunks("alpha\nbeta");
    let policy = default_chunking_policy();
    let invalid_policy = chunking_policy(100, 100);
    let line_policy = line_chunking_policy(12);
    let overlapped_policy = chunking_policy(12, 2);
    let policy_chunks = line_chunks_with_policy("alpha\nbeta\ngamma", line_policy);
    let overlong_chunks = line_chunks_with_policy("alphabet\nz", line_chunking_policy(4));
    let rejected_overlap_chunks = line_chunks_with_policy("alpha\nbeta", overlapped_policy);
    let result = search_result([search_hit(record, score.score)]);
    let single = single_hit_result(fixture_record("doc-2", "body"), 7);
    let empty = empty_search_result();
    let receipt = write_receipt(store, 2);

    if !score.compatible { return 1; }
    if score.score != 12 { return 1; }
    if !distance.compatible { return 1; }
    if distance.score != 2 { return 1; }
    if !squared_distance.compatible { return 1; }
    if squared_distance.score != 2 { return 1; }
    if bad_score.compatible { return 1; }
    if bad_squared_distance.compatible { return 1; }
    if !same_dimensions(left, right) { return 1; }
    if !is_valid_embedding(left) { return 1; }
    if is_valid_embedding(malformed) { return 1; }
    if model.dimensions != 3 { return 1; }
    if !is_valid_embedding_model(model) { return 1; }
    if is_valid_embedding_model(invalid_model) { return 1; }
    if is_valid_embedding_model(bad_model_name) { return 1; }
    if is_valid_embedding_model(bad_model_provider) { return 1; }
    if !embedding_matches_model(model, left) { return 1; }
    if embedding_matches_model(model, incompatible) { return 1; }
    if !is_valid_store_ref(store) { return 1; }
    if is_valid_store_ref(slash_store) { return 1; }
    if is_valid_store_ref(backslash_store) { return 1; }
    if is_valid_store_ref(colon_store) { return 1; }
    if is_valid_store_ref(space_store) { return 1; }
    if is_valid_store_ref(at_driver_store) { return 1; }
    if is_valid_store_ref(newline_driver_store) { return 1; }
    if !is_valid_vector_record(record) { return 1; }
    if is_valid_vector_record(invalid_record) { return 1; }
    if is_valid_vector_record(invalid_metadata_record) { return 1; }
    if is_valid_vector_record(space_record) { return 1; }
    if is_valid_vector_record(at_record) { return 1; }
    if is_valid_vector_record(path_record) { return 1; }
    if is_valid_vector_record(bad_metadata_key_record) { return 1; }
    if is_valid_vector_record(bad_metadata_value_record) { return 1; }
    if !record_matches(filter, record) { return 1; }
    if !record_matches(wildcard, record) { return 1; }
    if record_matches(value_only_filter, record) { return 1; }
    if record_matches(bad_filter_key, record) { return 1; }
    if record_matches(bad_filter_value, record) { return 1; }
    if !is_valid_filter(filter) { return 1; }
    if !is_wildcard_filter(wildcard) { return 1; }
    if is_valid_filter(value_only_filter) { return 1; }
    if is_valid_filter(bad_filter_key) { return 1; }
    if is_valid_filter(bad_filter_value) { return 1; }
    if query.filter.key != "kind" { return 1; }
    if !is_valid_vector_query(query) { return 1; }
    if is_valid_vector_query(invalid_query) { return 1; }
    if is_valid_vector_query(oversized_query) { return 1; }
    if is_valid_vector_query(bad_filter_query) { return 1; }
    if !record_compatible_with_query(query, record) { return 1; }
    if chunks[0].text != "alpha" { return 1; }
    if chunks[1].index != 1 { return 1; }
    if policy.max_chars != 1200 { return 1; }
    if !is_valid_chunking_policy(policy) { return 1; }
    if is_valid_chunking_policy(invalid_policy) { return 1; }
    if !is_valid_line_chunking_policy(line_policy) { return 1; }
    if is_valid_line_chunking_policy(overlapped_policy) { return 1; }
    if count_chunks(policy_chunks) != 2 { return 1; }
    if policy_chunks[0].text != "alpha\nbeta" { return 1; }
    if policy_chunks[1].index != 1 { return 1; }
    if count_chunks(overlong_chunks) != 2 { return 1; }
    if overlong_chunks[0].text != "alphabet" { return 1; }
    if count_chunks(rejected_overlap_chunks) != 0 { return 1; }
    if result.count != 1 { return 1; }
    if result.hits[0].score != 12 { return 1; }
    if single.count != 1 { return 1; }
    if empty.count != 0 { return 1; }
    if receipt.written != 2 { return 1; }
    if receipt.store.name != "docs" { return 1; }
    return 0;
}

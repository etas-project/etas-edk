module edk.vector.pure.filter_match;

import std.text.{contains, trim};
import edk.vector.types.{VectorFilter, VectorMetadata, VectorRecord};

public flow is_wildcard_filter(filter: VectorFilter) -> bool ![] {
    return filter.key == "" && filter.value == "";
}

public flow is_valid_filter(filter: VectorFilter) -> bool ![] {
    if is_wildcard_filter(filter) {
        return true;
    }
    return is_safe_filter_key(filter.key)
        && !contains(filter.value, "\n")
        && !contains(filter.value, "\r");
}

flow is_safe_filter_key(value: string) -> bool ![] {
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

public flow metadata_matches(filter: VectorFilter, metadata: VectorMetadata) -> bool ![] {
    if is_wildcard_filter(filter) {
        return true;
    }
    if !is_valid_filter(filter) {
        return false;
    }
    return metadata.key == filter.key && metadata.value == filter.value;
}

public flow record_matches(filter: VectorFilter, record: VectorRecord) -> bool ![] {
    if is_wildcard_filter(filter) {
        return true;
    }
    if !is_valid_filter(filter) {
        return false;
    }

    for item in record.metadata limit Iterations(65536) {
        if metadata_matches(filter, item) {
            return true;
        }
    }

    return false;
}

module edk.algorithm.matching;

import edk.algorithm.pure.array_helpers.contains_i32;
import edk.algorithm.types.{MatchEdge, MatchPair, MatchResult};

alias I32Lookup = {
    found: bool,
    value: i32,
};

alias AugmentResult = {
    pairs: Array<MatchPair>,
    matched: bool,
};

public flow greedy_maximum_matching(edges: Array<MatchEdge>) -> MatchResult ![] {
    let sorted_edges = sort_edges(edges);
    let lefts = collect_sorted_lefts(sorted_edges);
    var pairs: Array<MatchPair> = [];

    for left in lefts limit Iterations(65536) {
        let existing = right_for_left(pairs, left);
        if !existing.found {
            let result = try_match_left(left, sorted_edges, pairs, []);
            pairs = result.pairs;
        }
    }

    let ordered = canonicalize_pairs(lefts, pairs);
    return MatchResult { pairs = ordered, count = count_pairs(ordered) };
}

flow sort_edges(edges: Array<MatchEdge>) -> Array<MatchEdge> ![] {
    var sorted: Array<MatchEdge> = [];
    for edge in edges limit Iterations(65536) {
        if !contains_edge(sorted, edge.left, edge.right) {
            sorted = insert_edge_sorted(sorted, edge);
        }
    }
    return sorted;
}

flow collect_sorted_lefts(edges: Array<MatchEdge>) -> Array<i32> ![] {
    var lefts: Array<i32> = [];
    for edge in edges limit Iterations(65536) {
        if !contains_i32(lefts, edge.left) {
            lefts = insert_i32_sorted(lefts, edge.left);
        }
    }
    return lefts;
}

flow insert_i32_sorted(values: Array<i32>, value: i32) -> Array<i32> ![] {
    var out: Array<i32> = [];
    var inserted = false;
    for current in values limit Iterations(65536) {
        if !inserted && value < current {
            out = out.push(value);
            inserted = true;
        }
        out = out.push(current);
    }
    if !inserted {
        out = out.push(value);
    }
    return out;
}

flow insert_edge_sorted(edges: Array<MatchEdge>, edge: MatchEdge) -> Array<MatchEdge> ![] {
    var out: Array<MatchEdge> = [];
    var inserted = false;
    for current in edges limit Iterations(65536) {
        if !inserted && edge_less(edge, current) {
            out = out.push(edge);
            inserted = true;
        }
        out = out.push(current);
    }
    if !inserted {
        out = out.push(edge);
    }
    return out;
}

flow edge_less(left: MatchEdge, right: MatchEdge) -> bool ![] {
    if left.left < right.left {
        return true;
    }
    if left.left == right.left && left.right < right.right {
        return true;
    }
    return false;
}

flow contains_edge(edges: Array<MatchEdge>, left: i32, right: i32) -> bool ![] {
    for edge in edges limit Iterations(65536) {
        if edge.left == left && edge.right == right {
            return true;
        }
    }
    return false;
}

flow try_match_left(
    left: i32,
    sorted_edges: Array<MatchEdge>,
    pairs: Array<MatchPair>,
    seen_rights: Array<i32>,
) -> AugmentResult ![] {
    for edge in sorted_edges limit Iterations(65536) {
        if edge.left == left && !contains_i32(seen_rights, edge.right) {
            let next_seen = seen_rights.push(edge.right);
            let current = left_for_right(pairs, edge.right);
            if !current.found {
                return AugmentResult {
                    pairs = set_pair(pairs, left, edge.right),
                    matched = true,
                };
            }

            let rematched = try_match_left(current.value, sorted_edges, pairs, next_seen);
            if rematched.matched {
                return AugmentResult {
                    pairs = set_pair(rematched.pairs, left, edge.right),
                    matched = true,
                };
            }
        }
    }

    return AugmentResult { pairs = pairs, matched = false };
}

flow left_for_right(pairs: Array<MatchPair>, right: i32) -> I32Lookup ![] {
    for pair in pairs limit Iterations(65536) {
        if pair.right == right {
            return I32Lookup { found = true, value = pair.left };
        }
    }
    return I32Lookup { found = false, value = 0 };
}

flow right_for_left(pairs: Array<MatchPair>, left: i32) -> I32Lookup ![] {
    for pair in pairs limit Iterations(65536) {
        if pair.left == left {
            return I32Lookup { found = true, value = pair.right };
        }
    }
    return I32Lookup { found = false, value = 0 };
}

flow set_pair(pairs: Array<MatchPair>, left: i32, right: i32) -> Array<MatchPair> ![] {
    var out: Array<MatchPair> = [];
    var replaced = false;
    for pair in pairs limit Iterations(65536) {
        if pair.left == left {
            out = out.push(MatchPair { left = left, right = right });
            replaced = true;
        } else {
            out = out.push(pair);
        }
    }
    if !replaced {
        out = out.push(MatchPair { left = left, right = right });
    }
    return out;
}

flow canonicalize_pairs(lefts: Array<i32>, pairs: Array<MatchPair>) -> Array<MatchPair> ![] {
    var out: Array<MatchPair> = [];
    for left in lefts limit Iterations(65536) {
        let right = right_for_left(pairs, left);
        if right.found {
            out = out.push(MatchPair { left = left, right = right.value });
        }
    }
    return out;
}

flow count_pairs(pairs: Array<MatchPair>) -> i32 ![] {
    var count = 0;
    for pair in pairs limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

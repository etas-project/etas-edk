module tests.edk.algorithm_smoke.main;

import edk.algorithm.diff.diff_i32;
import edk.algorithm.graph.{scc, shortest_path, toposort, valid_directed_graph};
import edk.algorithm.matching.greedy_maximum_matching;
import edk.algorithm.pure.disjoint_set.{connected, singleton_sets, union};
import edk.algorithm.pure.heap.{heap_from_values, pop_min};
import edk.algorithm.pure.matrix.{filled, get, set_cell, transpose};
import edk.algorithm.pure.priority_queue.{empty_queue, peek_min, priority_item, push};
import edk.algorithm.pure.string_match.{contains_text, count_parts_after_split, prefix};
import edk.algorithm.ranking.rank_i32_desc;
import edk.algorithm.scheduling.schedule_dependencies;
import edk.algorithm.search.{breadth_first_distance, linear_search_i32};
import edk.algorithm.sort.stable_sort_i32;
import edk.algorithm.stats.summarize_i32;
import edk.algorithm.testsupport.generators.{dependency_chain, linear_graph, range_i32};
import edk.algorithm.types.{Dependency, DirectedGraph, Edge, MatchEdge, WeightedEdge, WeightedGraph};

flow check_graph() -> i32 ![Error<IndexError>] {
    let graph = DirectedGraph {
        nodes = 4,
        edges = [
            Edge { from = 0, to = 1 },
            Edge { from = 0, to = 2 },
            Edge { from = 1, to = 3 },
            Edge { from = 2, to = 3 },
        ],
    };
    let order = toposort(graph);
    let tied_order = toposort(DirectedGraph {
        nodes = 3,
        edges = [
            Edge { from = 0, to = 2 },
            Edge { from = 0, to = 1 },
        ],
    });
    let cycle = toposort(DirectedGraph {
        nodes = 2,
        edges = [
            Edge { from = 0, to = 1 },
            Edge { from = 1, to = 0 },
        ],
    });
    let components = scc(DirectedGraph {
        nodes = 4,
        edges = [
            Edge { from = 0, to = 1 },
            Edge { from = 1, to = 0 },
            Edge { from = 2, to = 3 },
        ],
    });
    let invalid_components = scc(DirectedGraph {
        nodes = 2,
        edges = [
            Edge { from = 0, to = 2 },
        ],
    });
    let invalid_graph = DirectedGraph {
        nodes = 1,
        edges = [Edge { from = 0, to = 1 }],
    };
    var invalid_component_count = 0;
    for component in invalid_components limit Iterations(65536) {
        invalid_component_count = invalid_component_count + 1;
    }
    let bfs = breadth_first_distance(graph, 0, 3, 16);
    let limited = breadth_first_distance(graph, 0, 3, 1);
    let invalid_limit = breadth_first_distance(graph, 0, 3, -1);

    let weighted = WeightedGraph {
        nodes = 4,
        edges = [
            WeightedEdge { from = 0, to = 1, weight = 4 },
            WeightedEdge { from = 0, to = 2, weight = 1 },
            WeightedEdge { from = 2, to = 1, weight = 2 },
            WeightedEdge { from = 1, to = 3, weight = 1 },
            WeightedEdge { from = 2, to = 3, weight = 5 },
        ],
    };
    let path = shortest_path(weighted, 0, 3);
    let invalid = shortest_path(WeightedGraph {
        nodes = 2,
        edges = [
            WeightedEdge { from = 0, to = 1, weight = -1 },
        ],
    }, 0, 1);

    if bfs.status != "ok" { return -1; }
    if limited.status != "limit_exceeded" { return -1; }
    if invalid_limit.status != "invalid_limit" { return -1; }
    if !tied_order.acyclic { return -1; }
    if tied_order.nodes[1] != 1 { return -1; }
    if tied_order.nodes[2] != 2 { return -1; }
    if cycle.acyclic { return -1; }
    if !valid_directed_graph(graph) { return -1; }
    if valid_directed_graph(invalid_graph) { return -1; }
    if components[0].nodes[0] != 0 { return -1; }
    if components[0].nodes[1] != 1 { return -1; }
    if components[1].nodes[0] != 2 { return -1; }
    if components[2].nodes[0] != 3 { return -1; }
    if invalid_component_count != 0 { return -1; }
    if path.status != "ok" { return -1; }
    if invalid.status != "invalid_weight" { return -1; }
    return order.nodes[0] + bfs.steps + path.cost;
}

flow check_collections() -> i32 ![Error<IndexError>] {
    let sorted = stable_sort_i32([5, 1, 3, 1]);
    let ranked = rank_i32_desc([3, 7, 7, 1]);
    let stats = summarize_i32([2, 4, 6, 8]);
    let diff = diff_i32([1, 2, 3], [1, 5, 3, 4]);
    let delete_diff = diff_i32([1, 2, 3], [1, 3]);
    let insert_diff = diff_i32([1, 3], [1, 2, 3]);
    let search = linear_search_i32(sorted, 3);
    if delete_diff.distance != 1 { return -1; }
    if delete_diff.edits[0].tag != "delete" { return -1; }
    if delete_diff.edits[0].old_index != 1 { return -1; }
    if delete_diff.edits[0].value != 2 { return -1; }
    if insert_diff.distance != 1 { return -1; }
    if insert_diff.edits[0].tag != "insert" { return -1; }
    if insert_diff.edits[0].new_index != 1 { return -1; }
    if insert_diff.edits[0].value != 2 { return -1; }
    return sorted[0] + ranked[0].score + stats.mean + diff.distance + search.steps;
}

flow check_matching_and_schedule() -> i32 ![Error<IndexError>] {
    let matches = greedy_maximum_matching([
        MatchEdge { left = 0, right = 0 },
        MatchEdge { left = 0, right = 1 },
        MatchEdge { left = 1, right = 1 },
    ]);
    let rematched = greedy_maximum_matching([
        MatchEdge { left = 0, right = 0 },
        MatchEdge { left = 1, right = 0 },
        MatchEdge { left = 0, right = 1 },
    ]);
    let rematched_shuffled = greedy_maximum_matching([
        MatchEdge { left = 1, right = 0 },
        MatchEdge { left = 0, right = 1 },
        MatchEdge { left = 0, right = 0 },
    ]);
    let schedule = schedule_dependencies(
        [0, 1, 2],
        [
            Dependency { prerequisite = 0, dependent = 1 },
            Dependency { prerequisite = 1, dependent = 2 },
        ],
    );
    let arbitrary_ids = schedule_dependencies(
        [30, 10, 20],
        [
            Dependency { prerequisite = 10, dependent = 20 },
            Dependency { prerequisite = 10, dependent = 30 },
        ],
    );
    let cycle = schedule_dependencies(
        [10, 20],
        [
            Dependency { prerequisite = 10, dependent = 20 },
            Dependency { prerequisite = 20, dependent = 10 },
        ],
    );
    let missing_task = schedule_dependencies(
        [10],
        [
            Dependency { prerequisite = 10, dependent = 20 },
        ],
    );
    let duplicates = schedule_dependencies([10, 10], []);

    if !schedule.feasible { return -1; }
    if schedule.order[0] != 0 { return -1; }
    if !arbitrary_ids.feasible { return -1; }
    if arbitrary_ids.order[0] != 10 { return -1; }
    if arbitrary_ids.order[1] != 20 { return -1; }
    if arbitrary_ids.order[2] != 30 { return -1; }
    if cycle.feasible { return -1; }
    if missing_task.feasible { return -1; }
    if duplicates.feasible { return -1; }
    if rematched.count != 2 { return -1; }
    if rematched.pairs[0].left != 0 { return -1; }
    if rematched.pairs[0].right != 1 { return -1; }
    if rematched.pairs[1].left != 1 { return -1; }
    if rematched.pairs[1].right != 0 { return -1; }
    if rematched_shuffled.count != rematched.count { return -1; }
    if rematched_shuffled.pairs[0].left != rematched.pairs[0].left { return -1; }
    if rematched_shuffled.pairs[0].right != rematched.pairs[0].right { return -1; }
    if rematched_shuffled.pairs[1].left != rematched.pairs[1].left { return -1; }
    if rematched_shuffled.pairs[1].right != rematched.pairs[1].right { return -1; }
    return matches.count + schedule.order[0] + arbitrary_ids.order[0];
}

flow check_pure_helpers() -> i32 ![Error<IndexError>] {
    let queue = push(push(empty_queue(), priority_item(10, 2, 1)), priority_item(20, 1, 2));
    let queue_head = peek_min(queue);
    let heap_head = pop_min(heap_from_values([4, 2, 9]));
    let groups = union(singleton_sets(4), 1, 3);
    let matrix = transpose(set_cell(filled(2, 2, 0), 0, 1, 7));
    let contains = contains_text("Etas EDK", "edk");
    let starts = prefix(" deterministic", "det");
    let parts = count_parts_after_split("a,b,c", ",");
    let generated = toposort(linear_graph(3));
    let range = range_i32(3, 2);
    let generated_schedule = schedule_dependencies(range_i32(0, 3), dependency_chain(3));

    if queue_head.item.value != 20 { return 0; }
    if heap_head.value != 2 { return 0; }
    if !connected(groups, 1, 3) { return 0; }
    if get(matrix, 1, 0) != 7 { return 0; }
    if !contains.matched { return 0; }
    if !starts.matched { return 0; }
    if parts != 3 { return 0; }
    if !generated.acyclic { return 0; }
    if range[0] != 3 { return 0; }
    if !generated_schedule.feasible { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![Error<IndexError>] {
    let graph_score = check_graph();
    let collection_score = check_collections();
    let schedule_score = check_matching_and_schedule();
    let pure_score = check_pure_helpers();
    if graph_score + collection_score + schedule_score + pure_score > 0 {
        return 0;
    }
    return 1;
}

module edk.algorithm.package_smoke;

import edk.algorithm.diff.diff_i32;
import edk.algorithm.graph.{scc, toposort, valid_directed_graph};
import edk.algorithm.matching.greedy_maximum_matching;
import edk.algorithm.pure.disjoint_set.{connected, singleton_sets, union};
import edk.algorithm.pure.heap.{heap_from_values, pop_min};
import edk.algorithm.pure.matrix.{filled, get, set_cell, transpose};
import edk.algorithm.pure.priority_queue.{empty_queue, peek_min, priority_item, push};
import edk.algorithm.pure.string_match.{contains_text, count_parts_after_split};
import edk.algorithm.scheduling.schedule_dependencies;
import edk.algorithm.search.breadth_first_distance;
import edk.algorithm.sort.stable_sort_i32;
import edk.algorithm.testsupport.generators.linear_graph;
import edk.algorithm.types.{Dependency, DirectedGraph, Edge, MatchEdge};

flow main(args: Array<string>) -> i32 ![Error<IndexError>] {
    let sorted = stable_sort_i32([3, 1, 2]);
    let order = toposort(DirectedGraph {
        nodes = 3,
        edges = [
            Edge { from = 0, to = 1 },
            Edge { from = 1, to = 2 },
        ],
    });
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
    let generated = toposort(linear_graph(3));
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
    let heap_pop = pop_min(heap_from_values([4, 2, 9]));
    let queue_pop = peek_min(push(push(empty_queue(), priority_item(10, 2, 1)), priority_item(20, 1, 2)));
    let groups = union(singleton_sets(3), 0, 2);
    let matrix = transpose(set_cell(filled(2, 2, 0), 0, 1, 7));
    let text_match = contains_text("Etas EDK", "edk");
    let parts = count_parts_after_split("a,b,c", ",");
    let invalid_limit = breadth_first_distance(linear_graph(3), 0, 2, -1);
    let schedule = schedule_dependencies(
        [30, 10, 20],
        [
            Dependency { prerequisite = 10, dependent = 20 },
            Dependency { prerequisite = 10, dependent = 30 },
        ],
    );
    let missing_task_schedule = schedule_dependencies(
        [10],
        [
            Dependency { prerequisite = 10, dependent = 20 },
        ],
    );
    let duplicate_task_schedule = schedule_dependencies([10, 10], []);
    let rematched = greedy_maximum_matching([
        MatchEdge { left = 0, right = 0 },
        MatchEdge { left = 1, right = 0 },
        MatchEdge { left = 0, right = 1 },
    ]);
    let delete_diff = diff_i32([1, 2, 3], [1, 3]);
    let insert_diff = diff_i32([1, 3], [1, 2, 3]);

    if sorted[0] != 1 { return 1; }
    if !order.acyclic { return 1; }
    if !tied_order.acyclic { return 1; }
    if tied_order.nodes[1] != 1 { return 1; }
    if tied_order.nodes[2] != 2 { return 1; }
    if cycle.acyclic { return 1; }
    if !generated.acyclic { return 1; }
    if !valid_directed_graph(linear_graph(3)) { return 1; }
    if valid_directed_graph(invalid_graph) { return 1; }
    if components[0].nodes[0] != 0 { return 1; }
    if components[0].nodes[1] != 1 { return 1; }
    if components[1].nodes[0] != 2 { return 1; }
    if components[2].nodes[0] != 3 { return 1; }
    if invalid_component_count != 0 { return 1; }
    if heap_pop.value != 2 { return 1; }
    if queue_pop.item.value != 20 { return 1; }
    if !connected(groups, 0, 2) { return 1; }
    if get(matrix, 1, 0) != 7 { return 1; }
    if !text_match.matched { return 1; }
    if parts != 3 { return 1; }
    if invalid_limit.status != "invalid_limit" { return 1; }
    if schedule.feasible == false { return 1; }
    if schedule.order[0] != 10 { return 1; }
    if schedule.order[1] != 20 { return 1; }
    if schedule.order[2] != 30 { return 1; }
    if missing_task_schedule.feasible { return 1; }
    if duplicate_task_schedule.feasible { return 1; }
    if rematched.count != 2 { return 1; }
    if rematched.pairs[0].left != 0 { return 1; }
    if rematched.pairs[0].right != 1 { return 1; }
    if rematched.pairs[1].left != 1 { return 1; }
    if rematched.pairs[1].right != 0 { return 1; }
    if delete_diff.distance != 1 { return 1; }
    if delete_diff.edits[0].tag != "delete" { return 1; }
    if delete_diff.edits[0].old_index != 1 { return 1; }
    if delete_diff.edits[0].value != 2 { return 1; }
    if insert_diff.distance != 1 { return 1; }
    if insert_diff.edits[0].tag != "insert" { return 1; }
    if insert_diff.edits[0].new_index != 1 { return 1; }
    if insert_diff.edits[0].value != 2 { return 1; }
    return 0;
}

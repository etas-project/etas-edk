module edk.algorithm.search;

import edk.algorithm.pure.array_helpers.{contains_i32, count_i32, repeat_i32};
import edk.algorithm.types.{DirectedGraph, SearchResult};

flow valid_node(nodes: i32, node: i32) -> bool ![] {
    return node >= 0 && node < nodes;
}

public flow linear_search_i32(values: Array<i32>, target: i32) -> SearchResult ![] {
    var index = 0;
    for value in values limit Iterations(65536) {
        if value == target {
            return SearchResult { found = true, node = index, steps = index + 1, status = "ok" };
        }
        index = index + 1;
    }
    return SearchResult { found = false, node = -1, steps = index, status = "no_match" };
}

public flow breadth_first_distance(graph: DirectedGraph, start: i32, goal: i32, max_steps: i32) -> SearchResult
    ![Error<IndexError>]
{
    if max_steps < 0 {
        return SearchResult { found = false, node = -1, steps = 0, status = "invalid_limit" };
    }
    if !valid_node(graph.nodes, start) || !valid_node(graph.nodes, goal) {
        return SearchResult { found = false, node = -1, steps = 0, status = "invalid_graph" };
    }
    for edge in graph.edges limit Iterations(65536) {
        if !valid_node(graph.nodes, edge.from) || !valid_node(graph.nodes, edge.to) {
            return SearchResult { found = false, node = -1, steps = 0, status = "invalid_graph" };
        }
    }

    var queue: Array<i32> = [start];
    var distance = repeat_i32(-1, graph.nodes);
    distance[start] = 0;
    var head = 0;
    var steps = 0;

    while head < count_i32(queue) limit Iterations(65536) {
        let current = queue[head];
        head = head + 1;

        if current == goal {
            return SearchResult { found = true, node = current, steps = distance[current], status = "ok" };
        }

        if steps >= max_steps {
            return SearchResult { found = false, node = -1, steps = steps, status = "limit_exceeded" };
        }

        steps = steps + 1;
        for edge in graph.edges limit Iterations(65536) {
            if edge.from == current && distance[edge.to] == -1 {
                distance[edge.to] = distance[current] + 1;
                if !contains_i32(queue, edge.to) {
                    queue = queue.push(edge.to);
                }
            }
        }
    }

    return SearchResult { found = false, node = -1, steps = steps, status = "no_path" };
}

module edk.algorithm.graph;

import edk.algorithm.pure.array_helpers.{count_i32, repeat_bool, repeat_i32, reverse_i32};
import edk.algorithm.types.{DirectedGraph, Edge, NodeId, Path, Scc, TopologicalOrder, WeightedGraph};

flow valid_node(nodes: i32, node: NodeId) -> bool ![] {
    return node >= 0 && node < nodes;
}

flow valid_edge(nodes: i32, edge: Edge) -> bool ![] {
    return valid_node(nodes, edge.from) && valid_node(nodes, edge.to);
}

public flow valid_directed_graph(graph: DirectedGraph) -> bool ![] {
    if graph.nodes < 0 {
        return false;
    }
    for edge in graph.edges limit Iterations(65536) {
        if !valid_edge(graph.nodes, edge) {
            return false;
        }
    }
    return true;
}

public flow outgoing(graph: DirectedGraph, node: NodeId) -> Array<NodeId> ![] {
    if !valid_node(graph.nodes, node) {
        return [];
    }

    var out: Array<NodeId> = [];
    for edge in graph.edges limit Iterations(65536) {
        if valid_edge(graph.nodes, edge) && edge.from == node {
            out = out.push(edge.to);
        }
    }
    return out;
}

flow reachable(graph: DirectedGraph, start: NodeId, goal: NodeId) -> bool ![Error<IndexError>] {
    if !valid_node(graph.nodes, start) || !valid_node(graph.nodes, goal) {
        return false;
    }
    if start == goal {
        return true;
    }

    var visited = repeat_bool(false, graph.nodes);
    var queue: Array<NodeId> = [start];
    visited[start] = true;
    var head = 0;

    while head < count_i32(queue) limit Iterations(65536) {
        let current = queue[head];
        head = head + 1;
        for edge in graph.edges limit Iterations(65536) {
            if valid_edge(graph.nodes, edge) && edge.from == current {
                if edge.to == goal {
                    return true;
                }
                if !visited[edge.to] {
                    visited[edge.to] = true;
                    queue = queue.push(edge.to);
                }
            }
        }
    }
    return false;
}

public flow scc(graph: DirectedGraph) -> Array<Scc> ![Error<IndexError>] {
    var components: Array<Scc> = [];
    if !valid_directed_graph(graph) {
        return components;
    }

    var assigned = repeat_bool(false, graph.nodes);
    var node = 0;
    while node < graph.nodes limit Iterations(65536) {
        if !assigned[node] {
            var component: Array<NodeId> = [];
            var member = 0;
            while member < graph.nodes limit Iterations(65536) {
                if !assigned[member] && reachable(graph, node, member) && reachable(graph, member, node) {
                    component = component.push(member);
                    assigned[member] = true;
                }
                member = member + 1;
            }
            components = components.push(Scc { nodes = component });
        }
        node = node + 1;
    }
    return components;
}

public flow toposort(graph: DirectedGraph) -> TopologicalOrder ![Error<IndexError>] {
    var indegree = repeat_i32(0, graph.nodes);
    for edge in graph.edges limit Iterations(65536) {
        if valid_edge(graph.nodes, edge) {
            indegree[edge.to] = indegree[edge.to] + 1;
        } else {
            return TopologicalOrder { nodes = repeat_i32(0, 0), acyclic = false };
        }
    }

    var order: Array<NodeId> = [];
    var emitted = repeat_bool(false, graph.nodes);
    var visited = 0;
    while visited < graph.nodes limit Iterations(65536) {
        var current = -1;
        var node = 0;
        while node < graph.nodes limit Iterations(65536) {
            if !emitted[node] && indegree[node] == 0 && current == -1 {
                current = node;
            }
            node = node + 1;
        }

        if current == -1 {
            return TopologicalOrder { nodes = order, acyclic = false };
        }

        emitted[current] = true;
        order = order.push(current);
        visited = visited + 1;

        for edge in graph.edges limit Iterations(65536) {
            if edge.from == current {
                indegree[edge.to] = indegree[edge.to] - 1;
            }
        }
    }

    return TopologicalOrder { nodes = order, acyclic = true };
}

public flow shortest_path(graph: WeightedGraph, start: NodeId, goal: NodeId) -> Path
    ![Error<IndexError>]
{
    if !valid_node(graph.nodes, start) || !valid_node(graph.nodes, goal) {
        return Path { nodes = repeat_i32(0, 0), cost = -1, found = false, status = "invalid_graph" };
    }

    for edge in graph.edges limit Iterations(65536) {
        if !valid_node(graph.nodes, edge.from) || !valid_node(graph.nodes, edge.to) {
            return Path { nodes = repeat_i32(0, 0), cost = -1, found = false, status = "invalid_graph" };
        }
        if edge.weight < 0 {
            return Path { nodes = repeat_i32(0, 0), cost = -1, found = false, status = "invalid_weight" };
        }
    }

    var dist = repeat_i32(1000000000, graph.nodes);
    var parent = repeat_i32(-1, graph.nodes);
    var visited = repeat_bool(false, graph.nodes);
    dist[start] = 0;

    var step = 0;
    while step < graph.nodes limit Iterations(65536) {
        var current = -1;
        var node = 0;
        while node < graph.nodes limit Iterations(65536) {
            if !visited[node] && (current == -1 || dist[node] < dist[current]) {
                current = node;
            }
            node = node + 1;
        }

        if current == -1 {
            break;
        }

        visited[current] = true;

        for edge in graph.edges limit Iterations(65536) {
            if edge.from == current {
                if dist[current] != 1000000000 {
                    if dist[current] > 1000000000 - edge.weight {
                        return Path { nodes = repeat_i32(0, 0), cost = -1, found = false, status = "invalid_weight" };
                    }
                    let candidate = dist[current] + edge.weight;
                    if candidate < dist[edge.to] {
                        dist[edge.to] = candidate;
                        parent[edge.to] = current;
                    }
                }
            }
        }

        step = step + 1;
    }

    if dist[goal] == 1000000000 {
        return Path { nodes = repeat_i32(0, 0), cost = -1, found = false, status = "no_path" };
    }

    var reversed: Array<NodeId> = [];
    var cursor = goal;
    while cursor != -1 limit Iterations(65536) {
        reversed = reversed.push(cursor);
        cursor = parent[cursor];
    }

    return Path {
        nodes = reverse_i32(reversed),
        cost = dist[goal],
        found = true,
        status = "ok",
    };
}

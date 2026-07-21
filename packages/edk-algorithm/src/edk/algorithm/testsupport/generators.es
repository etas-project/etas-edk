module edk.algorithm.testsupport.generators;

import edk.algorithm.types.{Dependency, DirectedGraph, Edge, WeightedEdge, WeightedGraph};

public flow range_i32(start: i32, count: i32) -> Array<i32> ![] {
    var values: Array<i32> = [];
    var i = 0;
    while i < count limit Iterations(65536) {
        values = values.push(start + i);
        i = i + 1;
    }
    return values;
}

public flow linear_graph(nodes: i32) -> DirectedGraph ![] {
    var edges: Array<Edge> = [];
    var node = 0;
    while node + 1 < nodes limit Iterations(65536) {
        edges = edges.push(Edge { from = node, to = node + 1 });
        node = node + 1;
    }
    return DirectedGraph {
        nodes = nodes,
        edges = edges,
    };
}

public flow chain_weighted_graph(nodes: i32, weight: i32) -> WeightedGraph ![] {
    var edges: Array<WeightedEdge> = [];
    var node = 0;
    while node + 1 < nodes limit Iterations(65536) {
        edges = edges.push(WeightedEdge {
            from = node,
            to = node + 1,
            weight = weight,
        });
        node = node + 1;
    }
    return WeightedGraph {
        nodes = nodes,
        edges = edges,
    };
}

public flow dependency_chain(count: i32) -> Array<Dependency> ![] {
    var dependencies: Array<Dependency> = [];
    var node = 0;
    while node + 1 < count limit Iterations(65536) {
        dependencies = dependencies.push(Dependency {
            prerequisite = node,
            dependent = node + 1,
        });
        node = node + 1;
    }
    return dependencies;
}

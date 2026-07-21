module edk.algorithm.types;

public alias NodeId = i32;
public alias EdgeId = i32;

public alias Edge = {
    from: NodeId,
    to: NodeId,
};

public alias WeightedEdge = {
    from: NodeId,
    to: NodeId,
    weight: i32,
};

public alias DirectedGraph = {
    nodes: i32,
    edges: Array<Edge>,
};

public alias WeightedGraph = {
    nodes: i32,
    edges: Array<WeightedEdge>,
};

public alias Path = {
    nodes: Array<NodeId>,
    cost: i32,
    found: bool,
    status: string,
};

public alias TopologicalOrder = {
    nodes: Array<NodeId>,
    acyclic: bool,
};

public alias Scc = {
    nodes: Array<NodeId>,
};

public alias SearchResult = {
    found: bool,
    node: NodeId,
    steps: i32,
    status: string,
};

public alias ScheduleTask = {
    id: i32,
    duration: i32,
};

public alias Dependency = {
    prerequisite: i32,
    dependent: i32,
};

public alias Schedule = {
    order: Array<i32>,
    feasible: bool,
};

public alias RankedI32 = {
    item: i32,
    score: i32,
    rank: i32,
};

public alias MatchEdge = {
    left: i32,
    right: i32,
};

public alias MatchPair = {
    left: i32,
    right: i32,
};

public alias MatchResult = {
    pairs: Array<MatchPair>,
    count: i32,
};

public alias Edit = {
    tag: string,
    old_index: i32,
    new_index: i32,
    value: i32,
};

public alias EditScript = {
    edits: Array<Edit>,
    distance: i32,
};

public alias StatsSummary = {
    count: i32,
    min: i32,
    max: i32,
    sum: i32,
    mean: i32,
};

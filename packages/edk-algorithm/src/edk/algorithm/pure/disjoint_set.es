module edk.algorithm.pure.disjoint_set;

import edk.algorithm.pure.array_helpers.count_i32;

public alias DisjointSet = {
    parents: Array<i32>,
};

public flow singleton_sets(size: i32) -> DisjointSet ![] {
    var parents: Array<i32> = [];
    var i = 0;
    while i < size limit Iterations(65536) {
        parents = parents.push(i);
        i = i + 1;
    }
    return DisjointSet { parents = parents };
}

public flow set_size(set: DisjointSet) -> i32 ![] {
    return count_i32(set.parents);
}

public flow find_root(set: DisjointSet, node: i32) -> i32 ![Error<IndexError>] {
    var cursor = node;
    while set.parents[cursor] != cursor limit Iterations(65536) {
        cursor = set.parents[cursor];
    }
    return cursor;
}

public flow connected(set: DisjointSet, left: i32, right: i32) -> bool ![Error<IndexError>] {
    return find_root(set, left) == find_root(set, right);
}

public flow union(set: DisjointSet, left: i32, right: i32) -> DisjointSet ![Error<IndexError>] {
    let left_root = find_root(set, left);
    let right_root = find_root(set, right);
    if left_root == right_root {
        return set;
    }

    var parents = set.parents;
    var i = 0;
    while i < count_i32(parents) limit Iterations(65536) {
        let current = DisjointSet { parents = parents };
        if find_root(current, i) == right_root {
            parents[i] = left_root;
        }
        i = i + 1;
    }
    return DisjointSet { parents = parents };
}

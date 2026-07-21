module edk.algorithm.pure.heap;

import edk.algorithm.pure.array_helpers.count_i32;

public alias HeapI32 = {
    values: Array<i32>,
};

public alias HeapPop = {
    found: bool,
    value: i32,
    heap: HeapI32,
};

public flow empty_heap() -> HeapI32 ![] {
    let values: Array<i32> = [];
    return HeapI32 { values = values };
}

public flow heap_size(heap: HeapI32) -> i32 ![] {
    return count_i32(heap.values);
}

flow insert_sorted(values: Array<i32>, value: i32) -> Array<i32> ![] {
    var out: Array<i32> = [];
    var inserted = false;
    for current in values limit Iterations(65536) {
        if !inserted && value <= current {
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

public flow insert(heap: HeapI32, value: i32) -> HeapI32 ![] {
    return HeapI32 { values = insert_sorted(heap.values, value) };
}

public flow heap_from_values(values: Array<i32>) -> HeapI32 ![] {
    var heap = empty_heap();
    for value in values limit Iterations(65536) {
        heap = insert(heap, value);
    }
    return heap;
}

public flow peek_min(heap: HeapI32) -> HeapPop ![Error<IndexError>] {
    if heap_size(heap) == 0 {
        return HeapPop { found = false, value = 0, heap = heap };
    }
    return HeapPop { found = true, value = heap.values[0], heap = heap };
}

public flow pop_min(heap: HeapI32) -> HeapPop ![Error<IndexError>] {
    let size = heap_size(heap);
    if size == 0 {
        return HeapPop { found = false, value = 0, heap = heap };
    }

    var out: Array<i32> = [];
    var i = 1;
    while i < size limit Iterations(65536) {
        out = out.push(heap.values[i]);
        i = i + 1;
    }

    return HeapPop {
        found = true,
        value = heap.values[0],
        heap = HeapI32 { values = out },
    };
}

public flow is_sorted_ascending(values: Array<i32>) -> bool ![Error<IndexError>] {
    let size = count_i32(values);
    var i = 1;
    while i < size limit Iterations(65536) {
        if values[i - 1] > values[i] {
            return false;
        }
        i = i + 1;
    }
    return true;
}

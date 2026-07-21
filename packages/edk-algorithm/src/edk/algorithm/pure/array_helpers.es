module edk.algorithm.pure.array_helpers;

public flow repeat_i32(value: i32, count: i32) -> Array<i32> ![] {
    var out: Array<i32> = [];
    var i = 0;
    while i < count limit Iterations(65536) {
        out = out.push(value);
        i = i + 1;
    }
    return out;
}

public flow repeat_bool(value: bool, count: i32) -> Array<bool> ![] {
    var out: Array<bool> = [];
    var i = 0;
    while i < count limit Iterations(65536) {
        out = out.push(value);
        i = i + 1;
    }
    return out;
}

public flow count_i32(values: Array<i32>) -> i32 ![] {
    var count = 0;
    for value in values limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow count_bool(values: Array<bool>) -> i32 ![] {
    var count = 0;
    for value in values limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow slice_i32(values: Array<i32>, start: i32, end: i32) -> Array<i32> ![Error<IndexError>] {
    var out: Array<i32> = [];
    var i = start;
    while i < end limit Iterations(65536) {
        out = out.push(values[i]);
        i = i + 1;
    }
    return out;
}

public flow reverse_i32(values: Array<i32>) -> Array<i32> ![Error<IndexError>] {
    var out: Array<i32> = [];
    var i = count_i32(values) - 1;
    while i >= 0 limit Iterations(65536) {
        out = out.push(values[i]);
        i = i - 1;
    }
    return out;
}

public flow contains_i32(values: Array<i32>, needle: i32) -> bool ![] {
    for value in values limit Iterations(65536) {
        if value == needle {
            return true;
        }
    }
    return false;
}

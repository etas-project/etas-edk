module edk.algorithm.sort;

import edk.algorithm.pure.array_helpers.{count_i32, slice_i32};

public flow merge_i32(left: Array<i32>, right: Array<i32>) -> Array<i32> ![Error<IndexError>] {
    var out: Array<i32> = [];
    var i = 0;
    var j = 0;
    let left_count = count_i32(left);
    let right_count = count_i32(right);

    while i < left_count && j < right_count limit Iterations(65536) {
        if left[i] <= right[j] {
            out = out.push(left[i]);
            i = i + 1;
        } else {
            out = out.push(right[j]);
            j = j + 1;
        }
    }

    while i < left_count limit Iterations(65536) {
        out = out.push(left[i]);
        i = i + 1;
    }

    while j < right_count limit Iterations(65536) {
        out = out.push(right[j]);
        j = j + 1;
    }

    return out;
}

public flow stable_sort_i32(values: Array<i32>) -> Array<i32> ![Error<IndexError>] {
    let value_count = count_i32(values);
    if value_count <= 1 {
        return values;
    }

    let mid = value_count / 2;
    let left = stable_sort_i32(slice_i32(values, 0, mid));
    let right = stable_sort_i32(slice_i32(values, mid, value_count));
    return merge_i32(left, right);
}

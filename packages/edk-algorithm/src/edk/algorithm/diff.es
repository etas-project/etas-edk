module edk.algorithm.diff;

import edk.algorithm.pure.array_helpers.{count_i32, repeat_i32};
import edk.algorithm.types.{Edit, EditScript};

public flow diff_i32(old: Array<i32>, new: Array<i32>) -> EditScript ![Error<IndexError>] {
    let old_count = count_i32(old);
    let new_count = count_i32(new);
    let cols = new_count + 1;
    var distances = repeat_i32(0, (old_count + 1) * cols);
    var i = 0;

    while i <= old_count limit Iterations(65536) {
        distances = set_distance(distances, i, new_count, cols, old_count - i);
        i = i + 1;
    }

    var j = 0;
    while j <= new_count limit Iterations(65536) {
        distances = set_distance(distances, old_count, j, cols, new_count - j);
        j = j + 1;
    }

    i = old_count - 1;
    while i >= 0 limit Iterations(65536) {
        j = new_count - 1;
        while j >= 0 limit Iterations(65536) {
            if old[i] == new[j] {
                let keep_cost = get_distance(distances, i + 1, j + 1, cols);
                distances = set_distance(distances, i, j, cols, keep_cost);
            } else {
                let delete_cost = 1 + get_distance(distances, i + 1, j, cols);
                let insert_cost = 1 + get_distance(distances, i, j + 1, cols);
                let replace_cost = 1 + get_distance(distances, i + 1, j + 1, cols);
                var best = delete_cost;
                if insert_cost < best {
                    best = insert_cost;
                }
                if replace_cost < best {
                    best = replace_cost;
                }
                distances = set_distance(distances, i, j, cols, best);
            }
            j = j - 1;
        }
        i = i - 1;
    }

    var edits: Array<Edit> = [];
    i = 0;
    j = 0;

    while i < old_count || j < new_count limit Iterations(65536) {
        if i < old_count && j < new_count && old[i] == new[j] {
            i = i + 1;
            j = j + 1;
        } else if i < old_count
            && get_distance(distances, i, j, cols) == 1 + get_distance(distances, i + 1, j, cols)
        {
            edits = edits.push(Edit {
                tag = "delete",
                old_index = i,
                new_index = -1,
                value = old[i],
            });
            i = i + 1;
        } else if j < new_count
            && get_distance(distances, i, j, cols) == 1 + get_distance(distances, i, j + 1, cols)
        {
            edits = edits.push(Edit {
                tag = "insert",
                old_index = -1,
                new_index = j,
                value = new[j],
            });
            j = j + 1;
        } else {
            edits = edits.push(Edit {
                tag = "replace",
                old_index = i,
                new_index = j,
                value = new[j],
            });
            i = i + 1;
            j = j + 1;
        }
    }

    return EditScript { edits = edits, distance = get_distance(distances, 0, 0, cols) };
}

flow distance_offset(row: i32, col: i32, width: i32) -> i32 ![] {
    return row * width + col;
}

flow get_distance(cells: Array<i32>, row: i32, col: i32, width: i32) -> i32 ![Error<IndexError>] {
    return cells[distance_offset(row, col, width)];
}

flow set_distance(
    cells: Array<i32>,
    row: i32,
    col: i32,
    width: i32,
    value: i32,
) -> Array<i32> ![Error<IndexError>] {
    var out = cells;
    out[distance_offset(row, col, width)] = value;
    return out;
}

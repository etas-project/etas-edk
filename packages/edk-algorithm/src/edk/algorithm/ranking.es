module edk.algorithm.ranking;

import edk.algorithm.pure.array_helpers.count_i32;
import edk.algorithm.types.RankedI32;

public flow rank_i32_desc(values: Array<i32>) -> Array<RankedI32> ![Error<IndexError>] {
    var ranked: Array<RankedI32> = [];
    var used: Array<bool> = [];
    for value in values limit Iterations(65536) {
        used = used.push(false);
    }

    let total = count_i32(values);
    var rank = 1;
    while rank <= total limit Iterations(65536) {
        var best_index = -1;
        var i = 0;
        while i < total limit Iterations(65536) {
            if !used[i] && (best_index == -1 || values[i] > values[best_index]) {
                best_index = i;
            }
            i = i + 1;
        }

        used[best_index] = true;
        ranked = ranked.push(RankedI32 {
            item = values[best_index],
            score = values[best_index],
            rank = rank,
        });
        rank = rank + 1;
    }

    return ranked;
}

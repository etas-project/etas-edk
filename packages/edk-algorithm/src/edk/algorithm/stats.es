module edk.algorithm.stats;

import edk.algorithm.pure.array_helpers.count_i32;
import edk.algorithm.types.StatsSummary;

public flow summarize_i32(values: Array<i32>) -> StatsSummary ![Error<IndexError>] {
    let total = count_i32(values);
    if total == 0 {
        return StatsSummary { count = 0, min = 0, max = 0, sum = 0, mean = 0 };
    }

    var min_value = values[0];
    var max_value = values[0];
    var sum = 0;
    for value in values limit Iterations(65536) {
        if value < min_value {
            min_value = value;
        }
        if value > max_value {
            max_value = value;
        }
        sum = sum + value;
    }

    return StatsSummary {
        count = total,
        min = min_value,
        max = max_value,
        sum = sum,
        mean = sum / total,
    };
}

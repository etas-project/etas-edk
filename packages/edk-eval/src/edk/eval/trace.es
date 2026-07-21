module edk.eval.trace;

import edk.eval.assertions.{fail, pass};
import edk.eval.errors.EvalError;
import edk.eval.types.{AssertionResult, GoldenTrace, TraceExpectation};
import std.text.{contains, join, trim};

public flow trace_expectation(action_name: string, order: i32) -> TraceExpectation ![] {
    return TraceExpectation {
        action_name = trim(action_name),
        order = order,
    };
}

public flow is_valid_trace_expectation(expectation: TraceExpectation) -> bool ![] {
    return is_safe_action_name(expectation.action_name)
        && expectation.order > 0;
}

public flow is_safe_action_name(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, ":")
        && !contains(normalized, ";")
        && !contains(normalized, "@")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

public flow empty_trace() -> GoldenTrace ![] {
    let expectations: Array<TraceExpectation> = [];
    return GoldenTrace { expectations = expectations };
}

public flow trace(expectations: Array<TraceExpectation>) -> GoldenTrace ![] {
    return GoldenTrace { expectations = expectations };
}

public flow count_expectations(trace: GoldenTrace) -> i32 ![] {
    var count = 0;
    for item in trace.expectations limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow contains_expectation(trace: GoldenTrace, expected: TraceExpectation) -> bool ![] {
    for item in trace.expectations limit Iterations(65536) {
        if item.action_name == expected.action_name && item.order == expected.order {
            return true;
        }
    }
    return false;
}

public flow count_matching_expectations(trace: GoldenTrace, expected: TraceExpectation) -> i32 ![] {
    var count = 0;
    for item in trace.expectations limit Iterations(65536) {
        if item.action_name == expected.action_name && item.order == expected.order {
            count = count + 1;
        }
    }
    return count;
}

public flow trace_orders_in_sequence(trace: GoldenTrace) -> bool ![] {
    var previous = 0;
    for item in trace.expectations limit Iterations(65536) {
        if item.order <= previous {
            return false;
        }
        previous = item.order;
    }
    return true;
}

public flow is_valid_trace(trace: GoldenTrace) -> bool ![] {
    for item in trace.expectations limit Iterations(65536) {
        if !is_valid_trace_expectation(item) {
            return false;
        }
    }
    return trace_orders_in_sequence(trace);
}

flow trace_pair_matches(left: TraceExpectation, right: TraceExpectation) -> bool ![] {
    return left.action_name == right.action_name && left.order == right.order;
}

public flow match_trace(expected: GoldenTrace, actual: GoldenTrace) -> AssertionResult ![Error<EvalError>] {
    if !is_valid_trace(expected) || !is_valid_trace(actual) {
        return fail("trace expectation is invalid");
    }
    let expected_count = count_expectations(expected);
    let actual_count = count_expectations(actual);
    if expected_count == actual_count {
        var expected_index = 0;
        for expected_item in expected.expectations limit Iterations(65536) {
            var actual_index = 0;
            for actual_item in actual.expectations limit Iterations(65536) {
                if actual_index == expected_index && !trace_pair_matches(expected_item, actual_item) {
                    return fail(join(["trace order mismatch: expected=", expected_item.action_name], ""));
                }
                actual_index = actual_index + 1;
            }
            expected_index = expected_index + 1;
        }
        for item in expected.expectations limit Iterations(65536) {
            if count_matching_expectations(expected, item) != count_matching_expectations(actual, item) {
                return fail(join(["trace expectation mismatch: action=", item.action_name], ""));
            }
        }
        return pass();
    }
    return fail("trace expectation count mismatch");
}

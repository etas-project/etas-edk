module edk.eval.pure.trace_match;

import edk.eval.trace.match_trace;
import edk.eval.errors.EvalError;
import edk.eval.types.{AssertionResult, GoldenTrace};

public flow matches(expected: GoldenTrace, actual: GoldenTrace) -> AssertionResult ![Error<EvalError>] {
    return match_trace(expected, actual);
}

module edk.eval.mocks.eval_store;

import edk.eval.golden.{eval_case, eval_result, eval_suite, is_valid_eval_suite, path_escapes_suite};
import edk.eval.trace.{empty_trace, trace, trace_expectation};
import edk.eval.types.{EvalCase, EvalFixture, EvalResult, EvalSuiteRef, EvalWriteReceipt};

public flow empty_fixture() -> EvalFixture ![] {
    let cases: Array<EvalCase> = [];
    return EvalFixture {
        suite = eval_suite("empty", "tests"),
        cases = cases,
        trace = empty_trace(),
    };
}

public flow fixture(suite: EvalSuiteRef, cases: Array<EvalCase>) -> EvalFixture ![] {
    return EvalFixture {
        suite = suite,
        cases = cases,
        trace = empty_trace(),
    };
}

public flow sample_fixture() -> EvalFixture ![] {
    let cases: Array<EvalCase> = [eval_case("case-1", "input", "ok")];
    return EvalFixture {
        suite = eval_suite("sample", "tests/eval"),
        cases = cases,
        trace = trace([trace_expectation("EdkHttp.request", 1)]),
    };
}

public flow count_cases(fixture: EvalFixture) -> i32 ![] {
    var count = 0;
    for item in fixture.cases limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow sample_result() -> EvalResult ![] {
    return eval_result(eval_suite("sample", "tests/eval"), "case-1", true, "ok");
}

public flow write_receipt(suite: EvalSuiteRef, result_count: i32, path: string) -> EvalWriteReceipt ![] {
    return EvalWriteReceipt {
        suite = suite,
        result_count = result_count,
        path = path,
    };
}

public flow is_valid_write_receipt(receipt: EvalWriteReceipt) -> bool ![] {
    return is_valid_eval_suite(receipt.suite)
        && receipt.result_count >= 0
        && receipt.path != ""
        && !path_escapes_suite(receipt.path);
}

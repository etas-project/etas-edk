module edk.eval.types;

public type EvalSuiteRef = {
    name: string,
    root: string,
};

public alias EvalCase = {
    id: string,
    input: string,
    expected_output: string,
};

public alias GoldenOutput = {
    text: string,
};

public alias TraceExpectation = {
    action_name: string,
    order: i32,
};

public alias GoldenTrace = {
    expectations: Array<TraceExpectation>,
};

public alias EvalFixture = {
    suite: EvalSuiteRef,
    cases: Array<EvalCase>,
    trace: GoldenTrace,
};

public alias AssertionResult = {
    ok: bool,
    message: string,
};

public alias DiffReport = {
    equal: bool,
    expected: string,
    actual: string,
    message: string,
};

public alias EvalResult = {
    suite: EvalSuiteRef,
    case_id: string,
    passed: bool,
    output: string,
    trace_ok: bool,
};

public alias EvalWriteReceipt = {
    suite: EvalSuiteRef,
    result_count: i32,
    path: string,
};

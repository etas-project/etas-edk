module edk.eval.tools.eval;

import edk.eval.effects.EdkEval;
import edk.eval.errors.EvalError;
import edk.eval.golden.{compare_golden as compare_golden_flow, eval_result, read_fixture};
import edk.eval.types.{AssertionResult, EvalCase, EvalFixture, EvalResult, EvalSuiteRef, GoldenOutput};
import edk.workspace.effects.EdkWorkspace;

public tool run_eval_case(suite: EvalSuiteRef, eval_case: EvalCase) -> EvalFixture ![EdkEval.read, EdkWorkspace.read, Error<EvalError>] {
    return read_fixture(suite, eval_case);
}

public tool compare_golden(eval_case: EvalCase, output: GoldenOutput) -> AssertionResult ![Error<EvalError>] {
    return compare_golden_flow(eval_case, output);
}

public tool summarize_eval_result(suite: EvalSuiteRef, case_id: string, passed: bool, output: string) -> EvalResult ![] {
    return eval_result(suite, case_id, passed, output);
}

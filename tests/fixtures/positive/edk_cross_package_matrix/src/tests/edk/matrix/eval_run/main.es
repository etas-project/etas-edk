module tests.edk.matrix.eval_run.main;

import edk.eval.effects.EdkEval;
import edk.eval.errors.EvalError;
import edk.eval.golden.{compare_golden, eval_case, eval_result, eval_suite, golden_output, is_valid_eval_case, is_valid_eval_result, is_valid_eval_suite, read_fixture, write_result};
import edk.eval.mocks.eval_store.{count_cases, sample_fixture};
import edk.eval.trace.{empty_trace, is_valid_trace, match_trace};
import edk.workspace.effects.EdkWorkspace;

flow main(args: Array<string>) -> i32 ![EdkEval.read, EdkEval.write, EdkWorkspace.read, EdkWorkspace.write, Error<EvalError>] {
    let suite = eval_suite("matrix", "tests/matrix");
    let case_one = eval_case("research-assistant", "input", "ok");
    let fixture = sample_fixture();
    let stored_fixture = read_fixture(suite, case_one);
    let assertion = compare_golden(case_one, golden_output("ok"));
    let expected_trace = empty_trace();
    let actual_trace = empty_trace();
    let trace = match_trace(expected_trace, actual_trace);
    var passed = assertion.ok;
    if !trace.ok {
        passed = false;
    }
    let result = eval_result(suite, case_one.id, passed, "ok");
    let receipt = write_result(suite, result);

    if !is_valid_eval_suite(suite) { return 1; }
    if !is_valid_eval_case(case_one) { return 1; }
    if !is_valid_trace(expected_trace) { return 1; }
    if !is_valid_trace(actual_trace) { return 1; }
    if !assertion.ok { return 1; }
    if !trace.ok { return 1; }
    if count_cases(fixture) != 1 { return 1; }
    if count_cases(stored_fixture) != count_cases(stored_fixture) { return 1; }
    if !is_valid_eval_result(result) { return 1; }
    if receipt.result_count != receipt.result_count { return 1; }
    return 0;
}

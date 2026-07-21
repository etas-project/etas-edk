module tests.edk.eval_pure_surface.main;

import edk.eval.assertions.{assert_equal, assert_true};
import edk.eval.errors.EvalError;
import edk.eval.golden.{compare_golden, eval_case, eval_result_with_trace, eval_suite, golden_output, is_safe_eval_token, is_valid_eval_case, is_valid_eval_result, is_valid_eval_suite, path_escapes_suite};
import edk.eval.mocks.eval_store.{count_cases, empty_fixture, fixture, is_valid_write_receipt, sample_fixture, sample_result, write_receipt};
import edk.eval.pure.diff.diff_text;
import edk.eval.pure.trace_match.matches;
import edk.eval.tools.eval.{compare_golden as tool_compare_golden, summarize_eval_result};
import edk.eval.trace.{contains_expectation, count_expectations, empty_trace, is_safe_action_name, is_valid_trace, is_valid_trace_expectation, match_trace, trace, trace_expectation, trace_orders_in_sequence};

flow check_assertions_and_diff() -> i32 ![Error<EvalError>] {
    let case_one = eval_case("case-1", "input", "ok");
    let bad_case = eval_case("bad/case", "input", "ok");
    let colon_case = eval_case("bad:case", "input", "ok");
    let space_case = eval_case("bad case", "input", "ok");
    let tab_case = eval_case("bad\tcase", "input", "ok");
    let at_case = eval_case("bad@case", "input", "ok");
    let semicolon_case = eval_case("bad;case", "input", "ok");
    let ok = compare_golden(case_one, golden_output("ok"));
    let tool_ok = tool_compare_golden(case_one, golden_output("ok"));
    let bad = compare_golden(case_one, golden_output("bad"));
    let tool_bad = tool_compare_golden(case_one, golden_output("bad"));
    let multiline_bad = compare_golden(eval_case("case-2", "input", "ok\nline"), golden_output("bad\rline"));
    let diff = diff_text("ok", "bad");
    let multiline_diff = diff_text("ok\nline", "bad\rline");
    let truth = assert_true(true, "must pass");
    let equal = assert_equal("same", "same");

    if !ok.ok { return 0; }
    if !tool_ok.ok { return 0; }
    if !is_valid_eval_case(case_one) { return 0; }
    if !is_safe_eval_token(case_one.id) { return 0; }
    if is_valid_eval_case(bad_case) { return 0; }
    if is_valid_eval_case(colon_case) { return 0; }
    if is_valid_eval_case(space_case) { return 0; }
    if is_valid_eval_case(tab_case) { return 0; }
    if is_valid_eval_case(at_case) { return 0; }
    if is_valid_eval_case(semicolon_case) { return 0; }
    if bad.ok { return 0; }
    if tool_bad.ok { return 0; }
    if bad.message != "golden output mismatch: expected=ok actual=bad" { return 0; }
    if multiline_bad.ok { return 0; }
    if multiline_bad.message != "golden output mismatch: expected=ok\\nline actual=bad\\rline" { return 0; }
    if diff.equal { return 0; }
    if diff.message != "text differs: expected=ok actual=bad" { return 0; }
    if multiline_diff.equal { return 0; }
    if multiline_diff.message != "text differs: expected=ok\\nline actual=bad\\rline" { return 0; }
    if !truth.ok { return 0; }
    if !equal.ok { return 0; }
    return 1;
}

flow check_trace_matching() -> i32 ![Error<EvalError>] {
    let expected = trace([trace_expectation("EdkWorkspace.read", 1), trace_expectation("EdkEval.write", 2)]);
    let actual = trace([trace_expectation("EdkWorkspace.read", 1), trace_expectation("EdkEval.write", 2)]);
    let wrong_order = trace([trace_expectation("EdkWorkspace.read", 2), trace_expectation("EdkEval.write", 1)]);
    let matched = match_trace(expected, actual);
    let pure_matched = matches(expected, actual);
    let mismatched = match_trace(expected, wrong_order);
    let ordered_wrong_actions = trace([trace_expectation("EdkEval.write", 1), trace_expectation("EdkWorkspace.read", 2)]);
    let ordered_mismatch = match_trace(expected, ordered_wrong_actions);
    let out_of_sequence = trace([trace_expectation("EdkEval.write", 2), trace_expectation("EdkWorkspace.read", 1)]);
    let out_of_sequence_result = match_trace(out_of_sequence, out_of_sequence);
    let duplicate_expected = trace([trace_expectation("A", 1), trace_expectation("A", 1)]);
    let duplicate_actual = trace([trace_expectation("A", 1), trace_expectation("B", 2)]);
    let duplicate_mismatch = match_trace(duplicate_expected, duplicate_actual);
    let invalid_expectation = trace_expectation("", 0);
    let unsafe_action_expectation = trace_expectation("EdkEval.write/bad", 1);
    let tab_action_expectation = trace_expectation("EdkEval.write\tbad", 1);
    let invalid_trace = trace([invalid_expectation]);
    let invalid_trace_result = match_trace(invalid_trace, invalid_trace);

    if count_expectations(expected) != 2 { return 0; }
    if !is_valid_trace(expected) { return 0; }
    if !trace_orders_in_sequence(expected) { return 0; }
    if trace_orders_in_sequence(out_of_sequence) { return 0; }
    if is_valid_trace(out_of_sequence) { return 0; }
    if is_valid_trace(invalid_trace) { return 0; }
    if is_valid_trace_expectation(invalid_expectation) { return 0; }
    if is_valid_trace_expectation(unsafe_action_expectation) { return 0; }
    if is_valid_trace_expectation(tab_action_expectation) { return 0; }
    if !is_safe_action_name("EdkEval.write") { return 0; }
    if is_safe_action_name("EdkEval.write/bad") { return 0; }
    if is_safe_action_name("EdkEval.write\tbad") { return 0; }
    if is_safe_action_name("EdkEval.write@bad") { return 0; }
    if is_safe_action_name("EdkEval.write;bad") { return 0; }
    if !contains_expectation(actual, trace_expectation("EdkEval.write", 2)) { return 0; }
    if !matched.ok { return 0; }
    if !pure_matched.ok { return 0; }
    if mismatched.ok { return 0; }
    if ordered_mismatch.ok { return 0; }
    if ordered_mismatch.message != "trace order mismatch: expected=EdkWorkspace.read" { return 0; }
    if out_of_sequence_result.ok { return 0; }
    if duplicate_mismatch.ok { return 0; }
    if invalid_trace_result.ok { return 0; }
    return 1;
}

flow check_mocks_and_results() -> i32 ![] {
    let suite = eval_suite("sample", "tests/eval");
    let bad_name_suite = eval_suite("bad suite", "tests/eval");
    let bad_suite = eval_suite("sample", "../outside");
    let trailing_parent_suite = eval_suite("sample", "tests/eval/..");
    let backslash_suite = eval_suite("sample", "tests\\eval");
    let colon_suite = eval_suite("sample", "C:eval");
    let tab_root_suite = eval_suite("sample", "tests/eval\tbad");
    let dotted_suite = eval_suite("sample", "..hidden/eval");
    let case_one = eval_case("case-1", "input", "ok");
    let custom = fixture(suite, [case_one]);
    let sample = sample_fixture();
    let empty = empty_fixture();
    let result = eval_result_with_trace(suite, "case-1", true, "ok", false);
    let bad_result = eval_result_with_trace(suite, "bad/case", true, "ok", false);
    let tab_result = eval_result_with_trace(suite, "bad\tcase", true, "ok", false);
    let tool_result = summarize_eval_result(suite, "case-1", true, "ok");
    let default_result = sample_result();
    let receipt = write_receipt(suite, 1, "tests/eval/results.json");
    let bad_receipt = write_receipt(suite, 1, "../outside/results.json");
    let tab_receipt = write_receipt(suite, 1, "tests/eval\tbad/results.json");

    if suite.name != "sample" { return 0; }
    if !is_valid_eval_suite(suite) { return 0; }
    if is_valid_eval_suite(bad_name_suite) { return 0; }
    if is_valid_eval_suite(bad_suite) { return 0; }
    if is_valid_eval_suite(trailing_parent_suite) { return 0; }
    if is_valid_eval_suite(backslash_suite) { return 0; }
    if is_valid_eval_suite(colon_suite) { return 0; }
    if is_valid_eval_suite(tab_root_suite) { return 0; }
    if !is_valid_eval_suite(dotted_suite) { return 0; }
    if path_escapes_suite("tests/eval") { return 0; }
    if !path_escapes_suite("../outside") { return 0; }
    if !path_escapes_suite("tests/eval/..") { return 0; }
    if !path_escapes_suite("tests\\eval") { return 0; }
    if !path_escapes_suite("C:eval") { return 0; }
    if !path_escapes_suite("tests/eval\tbad") { return 0; }
    if path_escapes_suite("..hidden/eval") { return 0; }
    if count_cases(custom) != 1 { return 0; }
    if count_cases(sample) != 1 { return 0; }
    if count_cases(empty) != 0 { return 0; }
    if !result.passed { return 0; }
    if !is_valid_eval_result(result) { return 0; }
    if is_valid_eval_result(bad_result) { return 0; }
    if is_valid_eval_result(tab_result) { return 0; }
    if result.trace_ok { return 0; }
    if !tool_result.trace_ok { return 0; }
    if !is_valid_eval_result(tool_result) { return 0; }
    if !default_result.trace_ok { return 0; }
    if receipt.path != "tests/eval/results.json" { return 0; }
    if !is_valid_write_receipt(receipt) { return 0; }
    if is_valid_write_receipt(bad_receipt) { return 0; }
    if is_valid_write_receipt(tab_receipt) { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![Error<EvalError>] {
    if check_assertions_and_diff() + check_trace_matching() + check_mocks_and_results() == 3 {
        return 0;
    }
    return 1;
}

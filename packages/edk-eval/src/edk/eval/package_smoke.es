module edk.eval.package_smoke;

import edk.eval.golden.{compare_golden, eval_case, eval_result, eval_result_with_trace, eval_suite, golden_output, is_safe_eval_token, is_valid_eval_case, is_valid_eval_result, is_valid_eval_suite, path_escapes_suite};
import edk.eval.errors.EvalError;
import edk.eval.mocks.eval_store.{count_cases, is_valid_write_receipt, sample_fixture, sample_result, write_receipt};
import edk.eval.pure.diff.diff_text;
import edk.eval.trace.{count_expectations, empty_trace, is_safe_action_name, is_valid_trace, is_valid_trace_expectation, match_trace, trace, trace_expectation, trace_orders_in_sequence};

flow main(args: Array<string>) -> i32 ![Error<EvalError>] {
    let case_one = eval_case("case-1", "input", "ok");
    let bad_case = eval_case("bad/case", "input", "ok");
    let colon_case = eval_case("bad:case", "input", "ok");
    let space_case = eval_case("bad case", "input", "ok");
    let tab_case = eval_case("bad\tcase", "input", "ok");
    let at_case = eval_case("bad@case", "input", "ok");
    let semicolon_case = eval_case("bad;case", "input", "ok");
    let assertion = compare_golden(case_one, golden_output("ok"));
    let repeated_assertion = compare_golden(case_one, golden_output("ok"));
    let multiline_assertion = compare_golden(eval_case("case-2", "input", "ok\nline"), golden_output("bad\rline"));
    let diff = diff_text("a", "b");
    let multiline_diff = diff_text("a\nb", "a\rc");
    let trace_result = match_trace(empty_trace(), empty_trace());
    let expected = trace([trace_expectation("EdkHttp.request", 1)]);
    let bad_actual = trace([trace_expectation("EdkHttp.request", 2)]);
    let mismatch = match_trace(expected, bad_actual);
    let ordered_expected = trace([trace_expectation("A", 1), trace_expectation("B", 2)]);
    let ordered_wrong_actions = trace([trace_expectation("B", 1), trace_expectation("A", 2)]);
    let ordered_mismatch = match_trace(ordered_expected, ordered_wrong_actions);
    let out_of_sequence = trace([trace_expectation("B", 2), trace_expectation("A", 1)]);
    let out_of_sequence_result = match_trace(out_of_sequence, out_of_sequence);
    let duplicate_expected = trace([trace_expectation("A", 1), trace_expectation("A", 1)]);
    let duplicate_actual = trace([trace_expectation("A", 1), trace_expectation("B", 2)]);
    let duplicate_mismatch = match_trace(duplicate_expected, duplicate_actual);
    let invalid_expectation = trace_expectation("", 0);
    let unsafe_action_expectation = trace_expectation("EdkEval.write/bad", 1);
    let tab_action_expectation = trace_expectation("EdkEval.write\tbad", 1);
    let invalid_trace = trace([invalid_expectation]);
    let invalid_trace_result = match_trace(invalid_trace, invalid_trace);
    let fixture = sample_fixture();
    let result = sample_result();
    let suite = eval_suite("sample", "tests/eval");
    let bad_name_suite = eval_suite("bad suite", "tests/eval");
    let bad_suite = eval_suite("sample", "../outside");
    let trailing_parent_suite = eval_suite("sample", "tests/eval/..");
    let backslash_suite = eval_suite("sample", "tests\\eval");
    let colon_suite = eval_suite("sample", "C:eval");
    let tab_root_suite = eval_suite("sample", "tests/eval\tbad");
    let dotted_suite = eval_suite("sample", "..hidden/eval");
    let explicit_result = eval_result_with_trace(suite, "case-1", true, "ok", false);
    let bad_result = eval_result_with_trace(suite, "bad/case", true, "ok", false);
    let tab_result = eval_result_with_trace(suite, "bad\tcase", true, "ok", false);
    let summarized_result = eval_result(suite, "case-1", true, "ok");
    let receipt = write_receipt(result.suite, 1, "tests/eval/results.json");
    let bad_receipt = write_receipt(result.suite, 1, "../outside/results.json");
    let tab_receipt = write_receipt(result.suite, 1, "tests/eval\tbad/results.json");

    if !assertion.ok { return 1; }
    if !repeated_assertion.ok { return 1; }
    if multiline_assertion.ok { return 1; }
    if multiline_assertion.message != "golden output mismatch: expected=ok\\nline actual=bad\\rline" { return 1; }
    if !is_valid_eval_case(case_one) { return 1; }
    if !is_safe_eval_token(case_one.id) { return 1; }
    if is_valid_eval_case(bad_case) { return 1; }
    if is_valid_eval_case(colon_case) { return 1; }
    if is_valid_eval_case(space_case) { return 1; }
    if is_valid_eval_case(tab_case) { return 1; }
    if is_valid_eval_case(at_case) { return 1; }
    if is_valid_eval_case(semicolon_case) { return 1; }
    if diff.equal { return 1; }
    if diff.message != "text differs: expected=a actual=b" { return 1; }
    if multiline_diff.equal { return 1; }
    if multiline_diff.message != "text differs: expected=a\\nb actual=a\\rc" { return 1; }
    if !trace_result.ok { return 1; }
    if mismatch.ok { return 1; }
    if ordered_mismatch.ok { return 1; }
    if ordered_mismatch.message != "trace order mismatch: expected=A" { return 1; }
    if !trace_orders_in_sequence(ordered_expected) { return 1; }
    if trace_orders_in_sequence(out_of_sequence) { return 1; }
    if is_valid_trace(out_of_sequence) { return 1; }
    if out_of_sequence_result.ok { return 1; }
    if duplicate_mismatch.ok { return 1; }
    if !is_valid_trace(expected) { return 1; }
    if is_valid_trace(invalid_trace) { return 1; }
    if is_valid_trace_expectation(invalid_expectation) { return 1; }
    if is_valid_trace_expectation(unsafe_action_expectation) { return 1; }
    if is_valid_trace_expectation(tab_action_expectation) { return 1; }
    if !is_safe_action_name("EdkEval.write") { return 1; }
    if is_safe_action_name("EdkEval.write/bad") { return 1; }
    if is_safe_action_name("EdkEval.write\tbad") { return 1; }
    if is_safe_action_name("EdkEval.write@bad") { return 1; }
    if is_safe_action_name("EdkEval.write;bad") { return 1; }
    if invalid_trace_result.ok { return 1; }
    if count_expectations(expected) != 1 { return 1; }
    if count_cases(fixture) != 1 { return 1; }
    if !is_valid_eval_suite(suite) { return 1; }
    if is_valid_eval_suite(bad_name_suite) { return 1; }
    if is_valid_eval_suite(bad_suite) { return 1; }
    if is_valid_eval_suite(trailing_parent_suite) { return 1; }
    if is_valid_eval_suite(backslash_suite) { return 1; }
    if is_valid_eval_suite(colon_suite) { return 1; }
    if is_valid_eval_suite(tab_root_suite) { return 1; }
    if !is_valid_eval_suite(dotted_suite) { return 1; }
    if path_escapes_suite("tests/eval") { return 1; }
    if !path_escapes_suite("../outside") { return 1; }
    if !path_escapes_suite("tests/eval/..") { return 1; }
    if !path_escapes_suite("tests\\eval") { return 1; }
    if !path_escapes_suite("C:eval") { return 1; }
    if !path_escapes_suite("tests/eval\tbad") { return 1; }
    if path_escapes_suite("..hidden/eval") { return 1; }
    if !result.passed { return 1; }
    if !is_valid_eval_result(explicit_result) { return 1; }
    if is_valid_eval_result(bad_result) { return 1; }
    if is_valid_eval_result(tab_result) { return 1; }
    if !summarized_result.trace_ok { return 1; }
    if !is_valid_eval_result(summarized_result) { return 1; }
    if receipt.result_count != 1 { return 1; }
    if !is_valid_write_receipt(receipt) { return 1; }
    if is_valid_write_receipt(bad_receipt) { return 1; }
    if is_valid_write_receipt(tab_receipt) { return 1; }
    return 0;
}

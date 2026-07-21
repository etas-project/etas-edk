module edk.eval.golden;

import std.text.{contains, split, starts_with, trim};
import edk.eval.assertions.assert_equal;
import edk.eval.effects.EdkEval;
import edk.eval.errors.EvalError;
import edk.eval.types.{AssertionResult, EvalCase, EvalFixture, EvalResult, EvalSuiteRef, EvalWriteReceipt, GoldenOutput};
import edk.workspace.effects.EdkWorkspace;

public flow eval_suite(name: string, root: string) -> EvalSuiteRef ![] {
    return EvalSuiteRef {
        name = trim(name),
        root = trim(root),
    };
}

public flow eval_case(id: string, input: string, expected_output: string) -> EvalCase ![] {
    return EvalCase {
        id = trim(id),
        input = input,
        expected_output = expected_output,
    };
}

public flow path_escapes_suite(path: string) -> bool ![] {
    let value = trim(path);
    if starts_with(value, "/") {
        return true;
    }
    if contains(value, "\\") || contains(value, ":") {
        return true;
    }
    if contains(value, "\t") || contains(value, "\n") || contains(value, "\r") {
        return true;
    }
    for part in split(value, "/") limit Iterations(65536) {
        if part == ".." {
            return true;
        }
    }
    return false;
}

public flow is_safe_eval_token(value: string) -> bool ![] {
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

public flow is_valid_eval_suite(suite: EvalSuiteRef) -> bool ![] {
    return is_safe_eval_token(suite.name)
        && suite.root != ""
        && !path_escapes_suite(suite.root);
}

public flow is_valid_eval_case(eval_case: EvalCase) -> bool ![] {
    return is_safe_eval_token(eval_case.id);
}

public flow golden_output(text: string) -> GoldenOutput ![] {
    return GoldenOutput { text = text };
}

public flow read_fixture(suite: EvalSuiteRef, eval_case: EvalCase) -> EvalFixture ![EdkEval.read, EdkWorkspace.read, Error<EvalError>] {
    return perform EdkEval.read(suite);
}

public flow compare_golden(eval_case: EvalCase, output: GoldenOutput) -> AssertionResult ![Error<EvalError>] {
    return assert_equal(eval_case.expected_output, output.text);
}

public flow eval_result(suite: EvalSuiteRef, case_id: string, passed: bool, output: string) -> EvalResult ![] {
    return eval_result_with_trace(suite, case_id, passed, output, true);
}

public flow eval_result_with_trace(suite: EvalSuiteRef, case_id: string, passed: bool, output: string, trace_ok: bool) -> EvalResult ![] {
    return EvalResult {
        suite = suite,
        case_id = trim(case_id),
        passed = passed,
        output = output,
        trace_ok = trace_ok,
    };
}

public flow is_valid_eval_result(result: EvalResult) -> bool ![] {
    return is_valid_eval_suite(result.suite)
        && is_safe_eval_token(result.case_id);
}

public flow write_result(suite: EvalSuiteRef, result: EvalResult) -> EvalWriteReceipt ![EdkEval.write, EdkWorkspace.write, Error<EvalError>] {
    return perform EdkEval.write(suite, result);
}

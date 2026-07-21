module edk.eval.assertions;

import edk.eval.types.AssertionResult;
import std.text.{join, split};

public flow pass() -> AssertionResult ![] {
    return AssertionResult {
        ok = true,
        message = "",
    };
}

public flow fail(message: string) -> AssertionResult ![] {
    return AssertionResult {
        ok = false,
        message = message,
    };
}

public flow assert_true(value: bool, message: string) -> AssertionResult ![] {
    if value {
        return pass();
    }
    return fail(message);
}

flow escape_message_text(value: string) -> string ![] {
    var escaped = "";
    var first_line = true;
    for line in split(value, "\n") limit Iterations(65536) {
        if first_line {
            escaped = line;
            first_line = false;
        } else {
            escaped = join([escaped, "\\n", line], "");
        }
    }

    var normalized = "";
    var first_part = true;
    for part in split(escaped, "\r") limit Iterations(65536) {
        if first_part {
            normalized = part;
            first_part = false;
        } else {
            normalized = join([normalized, "\\r", part], "");
        }
    }
    return normalized;
}

public flow assert_equal(expected: string, actual: string) -> AssertionResult ![] {
    if expected == actual {
        return pass();
    }
    return fail(join(["golden output mismatch: expected=", escape_message_text(expected), " actual=", escape_message_text(actual)], ""));
}

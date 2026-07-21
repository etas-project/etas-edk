module edk.eval.pure.diff;

import edk.eval.types.DiffReport;
import std.text.{join, split};

flow escape_newlines(value: string) -> string ![] {
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

public flow diff_text(expected: string, actual: string) -> DiffReport ![] {
    if expected == actual {
        return DiffReport {
            equal = true,
            expected = expected,
            actual = actual,
            message = "",
        };
    }
    return DiffReport {
        equal = false,
        expected = expected,
        actual = actual,
        message = join(["text differs: expected=", escape_newlines(expected), " actual=", escape_newlines(actual)], ""),
    };
}

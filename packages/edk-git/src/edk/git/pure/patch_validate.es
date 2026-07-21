module edk.git.pure.patch_validate;

import std.text.{contains, lines, split, starts_with, trim};
import edk.git.patch.{validation_error, validation_ok};
import edk.git.types.{Patch, PatchValidation};

public flow patch_path_token_escapes_repo(token: string) -> bool ![] {
    let value = trim(token);
    if value == "" || value == "/dev/null" {
        return false;
    }
    if starts_with(value, "/") {
        return true;
    }
    if contains(value, "\\") || contains(value, ":") {
        return true;
    }
    if contains(value, "\n") || contains(value, "\r") || contains(value, "\t") {
        return true;
    }
    for part in split(value, "/") limit Iterations(128) {
        if part == ".." {
            return true;
        }
    }
    return false;
}

flow patch_header_line_has_escape(line: string) -> bool ![] {
    for part in split(line, " ") limit Iterations(128) {
        if patch_path_token_escapes_repo(part) {
            return true;
        }
    }
    return false;
}

public flow contains_path_escape(text: string) -> bool ![] {
    for line in lines(text) limit Iterations(65536) {
        if starts_with(line, "diff --git ")
            || starts_with(line, "--- ")
            || starts_with(line, "+++ ")
            || starts_with(line, "rename from ")
            || starts_with(line, "rename to ")
        {
            if patch_header_line_has_escape(line) {
                return true;
            }
        }
    }
    return false;
}

public flow validate_patch(patch: Patch) -> PatchValidation ![] {
    if patch.text == "" {
        return validation_error("empty patch");
    }
    if contains_path_escape(patch.text) {
        return validation_error("patch path escapes repository");
    }
    return validation_ok();
}

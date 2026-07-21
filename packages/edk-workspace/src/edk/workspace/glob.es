module edk.workspace.glob;

import std.text.{contains, join, split, starts_with, trim};
import edk.workspace.path.{is_scope_escape, normalize, path_scope, path_value};
import edk.workspace.types.{Glob, PathScope, WorkspaceRootPath};

public flow glob(pattern: string) -> Glob ![] {
    let scope = path_scope(pattern);
    return Glob { pattern = scope.pattern };
}

public flow is_glob_escape(glob: Glob) -> bool ![] {
    return is_scope_escape(path_scope(glob.pattern));
}

public flow matches_exact_or_all(glob: Glob, path: WorkspaceRootPath) -> bool ![] {
    if is_glob_escape(glob) {
        return false;
    }
    let pattern = trim(glob.pattern);
    let normalized = normalize(path);
    let value = match normalized {
        Ok(clean) => path_value(clean),
        Err(_) => {
            return false;
        },
    };
    if pattern == "**" || pattern == value {
        return true;
    }
    if pattern == "*" {
        return count_segments(value) == 1;
    }
    if !contains(pattern, "*") {
        return false;
    }
    if ends_with_text(pattern, "/**") {
        let prefix = recursive_prefix(pattern);
        return value == prefix || starts_with(value, join([prefix, ""], "/"));
    }
    return path_segments_match(pattern, value);
}

flow count_segments(value: string) -> i32 ![] {
    var count = 0;
    for segment in split(value, "/") limit Iterations(65536) {
        if segment != "" {
            count = count + 1;
        }
    }
    return count;
}

flow count_split_parts(value: string, delimiter: string) -> i32 ![] {
    var count = 0;
    for part in split(value, delimiter) limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

flow wildcard_count(pattern: string) -> i32 ![] {
    return count_split_parts(pattern, "*") - 1;
}

flow ends_with_text(value: string, suffix: string) -> bool ![] {
    if suffix == "" {
        return true;
    }
    if !contains(value, suffix) {
        return false;
    }
    var last = value;
    for part in split(value, suffix) limit Iterations(65536) {
        last = part;
    }
    return last == "";
}

flow recursive_prefix(pattern: string) -> string ![] {
    var prefix = "";
    var first = true;
    for part in split(pattern, "/**") limit Iterations(65536) {
        if first {
            prefix = part;
            first = false;
        }
    }
    return trim(prefix);
}

flow segment_matches(pattern: string, value: string) -> bool ![] {
    if pattern == "*" {
        return value != "";
    }
    if !contains(pattern, "*") {
        return pattern == value;
    }
    if wildcard_count(pattern) > 1 {
        return false;
    }

    var prefix = "";
    var suffix = "";
    var first = true;
    for part in split(pattern, "*") limit Iterations(65536) {
        if first {
            prefix = part;
            first = false;
        } else {
            suffix = part;
        }
    }
    return starts_with(value, prefix) && ends_with_text(value, suffix);
}

flow path_segments_match(pattern: string, value: string) -> bool ![] {
    if count_segments(pattern) != count_segments(value) {
        return false;
    }

    var pattern_index = 0;
    for pattern_segment in split(pattern, "/") limit Iterations(65536) {
        if pattern_segment != "" {
            var matched = false;
            var value_index = 0;
            for value_segment in split(value, "/") limit Iterations(65536) {
                if value_segment != "" {
                    if value_index == pattern_index {
                        if !segment_matches(pattern_segment, value_segment) {
                            return false;
                        }
                        matched = true;
                    }
                    value_index = value_index + 1;
                }
            }
            if !matched {
                return false;
            }
            pattern_index = pattern_index + 1;
        }
    }
    return true;
}

public flow scope_matches(scope: PathScope, path: WorkspaceRootPath) -> bool ![] {
    if is_scope_escape(scope) {
        return false;
    }
    let pattern = trim(scope.pattern);
    if pattern == "**" || pattern == "" {
        return true;
    }
    let normalized = normalize(path);
    let value = match normalized {
        Ok(clean) => path_value(clean),
        Err(_) => {
            return false;
        },
    };
    return value == pattern || starts_with(value, join([pattern, ""], "/"));
}

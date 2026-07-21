module edk.workspace.path;

import std.text.{contains, join, split, starts_with, trim};
import edk.workspace.errors.{WorkspaceError, workspace_error};
import edk.workspace.types.{PathScope, ReportPath, ReportsRoot, WorkspacePath, WorkspaceRegion, WorkspaceRoot, WorkspaceRootPath};

flow split_path(value: string) -> Array<string> ![] {
    return split(value, "/");
}

flow normalize_value(value: string) -> string ![] {
    var parts: Array<string> = [];
    for part in split_path(value) limit Iterations(65536) {
        if part != "" && part != "." {
            parts = parts.push(part);
        }
    }
    return join(parts, "/");
}

flow value_escapes_workspace(value: string) -> bool ![] {
    let trimmed = trim(value);
    if starts_with(trimmed, "/") {
        return true;
    }
    if contains(trimmed, "\\") || contains(trimmed, ":") {
        return true;
    }
    if contains(trimmed, "\n") || contains(trimmed, "\r") || contains(trimmed, "\t") {
        return true;
    }
    for part in split_path(trimmed) limit Iterations(65536) {
        if part == ".." {
            return true;
        }
    }
    return false;
}

public flow path_value<R ~ WorkspaceRegion>(path: WorkspacePath<R>) -> string ![] {
    return path.value;
}

flow raw_workspace_path(value: string) -> WorkspaceRootPath ![] {
    return WorkspacePath<WorkspaceRoot> {
        value = trim(value),
    };
}

flow raw_report_path(value: string) -> ReportPath ![] {
    return WorkspacePath<ReportsRoot> {
        value = trim(value),
    };
}

flow path_error(kind: string, value: string, message: string) -> WorkspaceError ![] {
    return workspace_error(kind, raw_workspace_path(value), message);
}

public flow workspace_path(value: string) -> Result<WorkspaceRootPath, WorkspaceError> ![] {
    let normalized = trim(value);
    if value_escapes_workspace(normalized) {
        return Err(path_error("path_escape", normalized, "path escapes workspace root"));
    }
    return Ok(raw_workspace_path(normalize_value(normalized)));
}

public flow parse_path(value: string) -> Result<WorkspaceRootPath, WorkspaceError> ![] {
    return workspace_path(value);
}

public flow parse_report_path(value: string) -> Result<ReportPath, WorkspaceError> ![] {
    let parsed = workspace_path(value);
    return match parsed {
        Ok(path) => {
            let normalized = path_value(path);
            if normalized != "reports" && !starts_with(normalized, "reports/") {
                return Err(path_error("outside_reports", value, "path is outside reports scope"));
            }
            return Ok(raw_report_path(normalized));
        },
        Err(error) => Err(error),
    };
}

public flow report_path(value: string) -> Result<ReportPath, WorkspaceError> ![] {
    return parse_report_path(value);
}

public flow report_workspace_path(path: ReportPath) -> WorkspaceRootPath ![] {
    return raw_workspace_path(path_value(path));
}

public flow path_scope(pattern: string) -> PathScope ![] {
    let value = trim(pattern);
    if value_escapes_workspace(value) {
        return PathScope { pattern = value };
    }
    return PathScope { pattern = normalize_value(value) };
}

public flow is_path_escape(path: WorkspaceRootPath) -> bool ![] {
    return value_escapes_workspace(path_value(path));
}

public flow is_scope_escape(scope: PathScope) -> bool ![] {
    return value_escapes_workspace(scope.pattern);
}

public flow normalize(path: WorkspaceRootPath) -> Result<WorkspaceRootPath, WorkspaceError> ![] {
    if is_path_escape(path) {
        return Err(workspace_error("path_escape", path, "path escapes workspace root"));
    }
    return Ok(raw_workspace_path(normalize_value(path_value(path))));
}

public flow join_child(base: WorkspaceRootPath, child: string) -> Result<WorkspaceRootPath, WorkspaceError> ![] {
    let child_path = workspace_path(child);
    return match child_path {
        Ok(path) => normalize(raw_workspace_path(join([path_value(base), path_value(path)], "/"))),
        Err(error) => Err(error),
    };
}

module edk.http.headers.validate;

import std.text.{contains, trim};

public flow is_valid_header_name(name: string) -> bool ![] {
    let normalized = trim(name);
    if normalized == "" { return false; }
    if contains(normalized, ":") { return false; }
    if contains(normalized, " ") { return false; }
    if contains(normalized, "\t") { return false; }
    if contains(normalized, "\n") { return false; }
    if contains(normalized, "\r") { return false; }
    if contains(normalized, "(") { return false; }
    if contains(normalized, ")") { return false; }
    if contains(normalized, "<") { return false; }
    if contains(normalized, ">") { return false; }
    if contains(normalized, "@") { return false; }
    if contains(normalized, ",") { return false; }
    if contains(normalized, ";") { return false; }
    if contains(normalized, "\\") { return false; }
    if contains(normalized, "/") { return false; }
    if contains(normalized, "[") { return false; }
    if contains(normalized, "]") { return false; }
    if contains(normalized, "?") { return false; }
    if contains(normalized, "=") { return false; }
    if contains(normalized, "{") { return false; }
    if contains(normalized, "}") { return false; }
    return true;
}

public flow is_valid_header_value(value: string) -> bool ![] {
    let normalized = trim(value);
    if contains(normalized, "\n") { return false; }
    if contains(normalized, "\r") { return false; }
    return true;
}

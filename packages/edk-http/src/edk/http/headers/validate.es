module edk.http.headers.validate;

import std.text.{contains, split, trim};

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

public flow is_valid_media_type(value: string) -> bool ![] {
    if value == "" {
        return true;
    }
    let normalized = trim(value);
    if normalized == "" { return false; }
    if contains(normalized, "\n") { return false; }
    if contains(normalized, "\r") { return false; }
    if contains(normalized, "\t") { return false; }
    if contains(normalized, "\0") { return false; }
    let visible_ascii = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
    for character in split(normalized, "") limit Iterations(65536) {
        if character != "" && !contains(visible_ascii, character) {
            return false;
        }
    }
    return true;
}

module edk.pdf.pure.pdf_parse;

import std.text.{contains, split, trim};

flow first_header_line(bytes_prefix: string) -> string ![] {
    var index = 0;
    var line = "";
    for part in split(bytes_prefix, "\n") limit Iterations(2) {
        if index == 0 {
            line = trim(part);
        }
        index = index + 1;
    }
    return line;
}

flow is_supported_pdf_header_line(line: string) -> bool ![] {
    return line == "%PDF-1.0"
        || line == "%PDF-1.1"
        || line == "%PDF-1.2"
        || line == "%PDF-1.3"
        || line == "%PDF-1.4"
        || line == "%PDF-1.5"
        || line == "%PDF-1.6"
        || line == "%PDF-1.7"
        || line == "%PDF-2.0";
}

public flow has_pdf_header(bytes_prefix: string) -> bool ![] {
    return is_supported_pdf_header_line(first_header_line(bytes_prefix));
}

public flow has_encryption_marker(bytes_prefix: string) -> bool ![] {
    return contains(bytes_prefix, "/Encrypt");
}

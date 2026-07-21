module edk.docs.errors;

public type DocsError = {
    code: string,
    message: string,
};

public type ParseError = {
    format: string,
    message: string,
};

public type ConversionError = {
    source: string,
    target: string,
    message: string,
};

public type SanitizationError = {
    message: string,
};

public type UnsupportedFormatError = {
    format: string,
    message: string,
};

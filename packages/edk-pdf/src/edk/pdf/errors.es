module edk.pdf.errors;

public type PdfError = {
    code: string,
    message: string,
};

public type PdfParseError = {
    path: string,
    message: string,
};

public type EncryptedPdfError = {
    path: string,
    message: string,
};

public type UnsupportedPdfError = {
    feature: string,
    message: string,
};

public type RenderError = {
    page: i32,
    message: string,
};

public type CitationError = {
    message: string,
};

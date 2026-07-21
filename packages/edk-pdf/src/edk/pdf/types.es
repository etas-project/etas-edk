module edk.pdf.types;

import edk.workspace.types.WorkspaceRootPath;

public alias PdfTextSpan = {
    page: i32,
    text: string,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
};

public alias PdfImageRef = {
    id: string,
    page: i32,
    media_type: string,
};

public alias PdfPage = {
    number: i32,
    width: i32,
    height: i32,
    text_spans: Array<PdfTextSpan>,
    images: Array<PdfImageRef>,
};

public alias PdfOutline = {
    title: string,
    page: i32,
    level: i32,
};

public alias PdfMetadata = {
    title: string,
    author: string,
    page_count: i32,
    encrypted: bool,
};

public alias PdfDocument = {
    path: WorkspaceRootPath,
    metadata: PdfMetadata,
    pages: Array<PdfPage>,
    outline: Array<PdfOutline>,
};

public alias CitationRef = {
    key: string,
    page: i32,
    text: string,
};

public alias PageRenderOptions = {
    page: i32,
    dpi: i32,
    format: string,
};

public alias PageRenderResult = {
    path: WorkspaceRootPath,
    page: i32,
    media_type: string,
    artifact_id: string,
};

public alias TextLayoutSummary = {
    page_count: i32,
    span_count: i32,
};

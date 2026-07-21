module edk.docs.types;

import edk.workspace.types.WorkspaceRootPath;

public alias DocumentFormat = {
    name: string,
    media_type: string,
};

public alias DocumentInput = {
    path: WorkspaceRootPath,
    format: DocumentFormat,
    text: string,
};

public alias DocumentOutput = {
    path: WorkspaceRootPath,
    format: DocumentFormat,
    text: string,
};

public alias DocumentBlock = {
    kind: string,
    text: string,
    level: i32,
};

public alias DocumentAst = {
    blocks: Array<DocumentBlock>,
};

public alias MarkdownDocument = {
    text: string,
    ast: DocumentAst,
};

public alias HtmlDocument = {
    html: Sanitized<string>,
    sanitized_text: string,
    ast: DocumentAst,
};

public alias DocxDocument = {
    text: string,
    ast: DocumentAst,
};

public alias PlainTextDocument = {
    text: string,
};

public alias ConversionOptions = {
    preserve_links: bool,
    sanitize_html: bool,
};

public alias SanitizationReport = {
    changed: bool,
    removed_nodes: i32,
    message: string,
};

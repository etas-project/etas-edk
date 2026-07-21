module edk.docs.docx;

import edk.docs.markdown.empty_ast;
import edk.docs.types.{DocxDocument, DocumentAst};

public flow docx_document(text: string) -> DocxDocument ![] {
    return DocxDocument {
        text = text,
        ast = empty_ast(),
    };
}

public flow docx_with_ast(text: string, ast: DocumentAst) -> DocxDocument ![] {
    return DocxDocument {
        text = text,
        ast = ast,
    };
}

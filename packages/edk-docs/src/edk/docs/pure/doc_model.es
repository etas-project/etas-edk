module edk.docs.pure.doc_model;

import edk.docs.markdown.{block, document_ast, is_valid_block};
import edk.docs.types.{DocumentAst, DocumentBlock};

public flow one_paragraph(text: string) -> DocumentAst ![] {
    let blocks: Array<DocumentBlock> = [block("paragraph", text, 0)];
    return document_ast(blocks);
}

public flow count_blocks(ast: DocumentAst) -> i32 ![] {
    var count = 0;
    for item in ast.blocks limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow count_kind(ast: DocumentAst, kind: string) -> i32 ![] {
    var count = 0;
    for item in ast.blocks limit Iterations(65536) {
        if item.kind == kind {
            count = count + 1;
        }
    }
    return count;
}

public flow count_heading_level(ast: DocumentAst, level: i32) -> i32 ![] {
    var count = 0;
    for item in ast.blocks limit Iterations(65536) {
        if item.kind == "heading" && item.level == level {
            count = count + 1;
        }
    }
    return count;
}

public flow ast_is_valid(ast: DocumentAst) -> bool ![] {
    for item in ast.blocks limit Iterations(65536) {
        if !is_valid_block(item) {
            return false;
        }
    }
    return true;
}

public flow append_block(ast: DocumentAst, item: DocumentBlock) -> DocumentAst ![] {
    return document_ast(ast.blocks.push(item));
}

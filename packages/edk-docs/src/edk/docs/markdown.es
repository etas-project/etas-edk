module edk.docs.markdown;

import edk.docs.types.{DocumentAst, DocumentBlock, MarkdownDocument};
import std.text.{contains, trim};

public flow empty_ast() -> DocumentAst ![] {
    let blocks: Array<DocumentBlock> = [];
    return DocumentAst { blocks = blocks };
}

public flow document_ast(blocks: Array<DocumentBlock>) -> DocumentAst ![] {
    return DocumentAst { blocks = blocks };
}

public flow block(kind: string, text: string, level: i32) -> DocumentBlock ![] {
    return DocumentBlock {
        kind = trim(kind),
        text = trim(text),
        level = level,
    };
}

flow is_safe_block_text(text: string) -> bool ![] {
    let value = trim(text);
    return value != ""
        && !contains(value, "\n")
        && !contains(value, "\r");
}

public flow is_valid_block(item: DocumentBlock) -> bool ![] {
    if item.kind == "heading" {
        return item.level > 0 && item.level <= 6 && is_safe_block_text(item.text);
    }
    if item.kind == "paragraph" {
        return item.level == 0 && is_safe_block_text(item.text);
    }
    return false;
}

public flow markdown_document(text: string) -> MarkdownDocument ![] {
    return MarkdownDocument {
        text = text,
        ast = empty_ast(),
    };
}

public flow markdown_with_ast(text: string, ast: DocumentAst) -> MarkdownDocument ![] {
    return MarkdownDocument {
        text = text,
        ast = ast,
    };
}

public flow markdown_from_blocks(text: string, blocks: Array<DocumentBlock>) -> MarkdownDocument ![] {
    return markdown_with_ast(text, document_ast(blocks));
}

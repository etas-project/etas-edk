module edk.docs.pure.markdown_parse;

import std.text.{split, starts_with, trim};
import edk.docs.markdown.{block, document_ast, empty_ast, markdown_from_blocks, markdown_with_ast};
import edk.docs.types.{DocumentAst, DocumentBlock, MarkdownDocument};

public flow parse_heading(line: string) -> DocumentBlock ![] {
    let value = trim(line);
    if starts_with(value, "####### ") {
        return block("paragraph", value, 0);
    }
    if starts_with(value, "###### ") {
        return block("heading", value, 6);
    }
    if starts_with(value, "##### ") {
        return block("heading", value, 5);
    }
    if starts_with(value, "#### ") {
        return block("heading", value, 4);
    }
    if starts_with(value, "### ") {
        return block("heading", value, 3);
    }
    if starts_with(value, "## ") {
        return block("heading", value, 2);
    }
    if starts_with(value, "# ") {
        return block("heading", value, 1);
    }
    return block("paragraph", value, 0);
}

public flow parse_single_line(line: string) -> MarkdownDocument ![] {
    if trim(line) == "" {
        return markdown_with_ast(line, empty_ast());
    }
    let blocks: Array<DocumentBlock> = [parse_heading(line)];
    return markdown_with_ast(line, DocumentAst { blocks = blocks });
}

public flow parse_lines(text: string) -> MarkdownDocument ![] {
    var blocks: Array<DocumentBlock> = [];
    for line in split(text, "\n") limit Iterations(65536) {
        if trim(line) != "" {
            blocks = blocks.push(parse_heading(line));
        }
    }
    return markdown_from_blocks(text, blocks);
}

public flow count_markdown_blocks(doc: MarkdownDocument) -> i32 ![] {
    var count = 0;
    for item in doc.ast.blocks limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow has_heading(doc: MarkdownDocument) -> bool ![] {
    for item in doc.ast.blocks limit Iterations(65536) {
        if item.kind == "heading" {
            return true;
        }
    }
    return false;
}

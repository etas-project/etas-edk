module edk.docs.mocks.docs;

import edk.docs.convert.{document_input, document_output, html_format, markdown_format, plain_text_format};
import edk.docs.markdown.markdown_document;
import edk.docs.types.{DocumentInput, DocumentOutput, MarkdownDocument};
import edk.workspace.path.workspace_path;
import edk.workspace.types.WorkspaceRootPath;

flow sample_path(value: string) -> WorkspaceRootPath ![] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => error.path,
    };
}

public flow sample_markdown() -> MarkdownDocument ![] {
    return markdown_document("# Sample");
}

public flow sample_markdown_input() -> DocumentInput ![] {
    return document_input(sample_path("docs/sample.md"), markdown_format(), "# Sample");
}

public flow sample_html_output() -> DocumentOutput ![] {
    return document_output(sample_path("docs/sample.html"), html_format(), "<h1>Sample</h1>");
}

public flow sample_text_output() -> DocumentOutput ![] {
    return document_output(sample_path("docs/sample.txt"), plain_text_format(), "Sample");
}

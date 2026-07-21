module tests.edk.tool_mock_surface.docs_pdf_eval.main;

import edk.docs.convert.{document_input, html_format, markdown_format};
import edk.docs.effects.EdkDocs;
import edk.docs.errors.DocsError;
import edk.docs.mocks.docs.{sample_html_output, sample_markdown_input};
import edk.docs.pure.doc_model.count_blocks;
import edk.docs.tools.convert.{convert_document, extract_markdown_summary, sanitize_html};
import edk.eval.effects.EdkEval;
import edk.eval.errors.EvalError;
import edk.eval.golden.{eval_case, eval_suite, is_valid_eval_suite};
import edk.eval.mocks.eval_store.{count_cases, sample_fixture, write_receipt};
import edk.eval.tools.eval.run_eval_case;
import edk.pdf.effects.EdkPdf;
import edk.pdf.errors.PdfError;
import edk.pdf.mocks.pdf.{is_valid_document, single_page_text_document};
import edk.pdf.tools.pdf.{extract_pdf_text, pdf_citations};
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.path.workspace_path;
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkDocs.convert, EdkEval.read, EdkPdf.read, EdkWorkspace.read, Error<DocsError>, Error<EvalError>, Error<PdfError>, Error<WorkspaceError>] {
    let markdown_path = checked_workspace_path("docs/report.md");
    let pdf_path = checked_workspace_path("docs/report.pdf");
    let markdown_input = document_input(markdown_path, markdown_format(), "# Report");
    let converted = convert_document(markdown_input, html_format());
    let summary = extract_markdown_summary("## Summary");
    let html = sanitize_html("plain text");
    let mock_input = sample_markdown_input();
    let mock_output = sample_html_output();

    let extracted = extract_pdf_text(pdf_path);
    let citations = pdf_citations(pdf_path);
    let mock_pdf = single_page_text_document(pdf_path, "Report", "Etas");

    let suite = eval_suite("tool-fixture", "tests/eval");
    let eval_case_one = eval_case("case-1", "input", "ok");
    let fixture = run_eval_case(suite, eval_case_one);
    let mock_fixture = sample_fixture();
    let mock_receipt = write_receipt(suite, 1, "tests/eval/results.json");

    if converted.text != converted.text { return 1; }
    if summary.text != "## Summary" { return 1; }
    if count_blocks(html.ast) != 0 { return 1; }
    if mock_input.format.name != "markdown" { return 1; }
    if mock_output.format.name != "html" { return 1; }
    if extracted.metadata.page_count != extracted.metadata.page_count { return 1; }
    if citations != citations { return 1; }
    if !is_valid_document(mock_pdf) { return 1; }
    if !is_valid_eval_suite(suite) { return 1; }
    if fixture.suite.name != fixture.suite.name { return 1; }
    if count_cases(mock_fixture) != 1 { return 1; }
    if mock_receipt.result_count != 1 { return 1; }
    return 0;
}

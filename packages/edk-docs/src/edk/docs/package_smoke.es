module edk.docs.package_smoke;

import edk.docs.convert.{docx_format, format, html_format, input_text, is_supported_format, is_valid_document_input, is_valid_document_output, is_valid_format, markdown_format, pdf_format, safe_conversion_options};
import edk.docs.markdown.{block, is_valid_block};
import edk.docs.mocks.docs.{sample_html_output, sample_markdown_input};
import edk.docs.pure.doc_model.{append_block, ast_is_valid, count_blocks, count_heading_level, count_kind, one_paragraph};
import edk.docs.pure.html_sanitize.{count_sanitization_findings, needs_sanitization, report, sanitize};
import edk.docs.pure.markdown_parse.{count_markdown_blocks, has_heading, parse_lines, parse_single_line};
import edk.workspace.path.path_value;

flow main(args: Array<string>) -> i32 ![] {
    let parsed = parse_single_line("# Title");
    let empty_line = parse_single_line("  ");
    let parsed_lines = parse_lines("# Title\n\nBody");
    let bad_format = format("unknown", "");
    let mismatched_format = format("markdown", "text/html");
    let unsafe_name_format = format("mark/down", "text/markdown");
    let tab_name_format = format("mark\tdown", "text/markdown");
    let unsafe_media_format = format("markdown", "text/markdown\nx-bad: yes");
    let tab_media_format = format("markdown", "text/markdown\tbad");
    let parameter_media_format = format("markdown", "text/markdown;charset=utf-8");
    let pdf_input = input_text("PDF derived text", pdf_format());
    let valid_block = block("paragraph", "Body", 0);
    let invalid_block = block("heading", "", 0);
    let multiline_block = block("paragraph", "Body\nInjected", 0);
    let input = input_text(parsed.text, markdown_format());
    let options = safe_conversion_options();
    let model = one_paragraph("Body");
    let invalid_model = append_block(model, invalid_block);
    let multiline_model = append_block(model, multiline_block);
    let deep_heading = parse_single_line("###### Deep");
    let too_deep_heading = parse_single_line("####### Too Deep");
    let no_space_heading = parse_single_line("#NoSpace");
    let unsafe_report = report("<script>");
    let complex_report = report("<img srcdoc=\"x\" onload=bad>");
    let active_content_report = report("<iframe srcdoc=\"x\" style=\"background:url(javascript:bad)\" onclick=bad>");
    let encoded_report = report("&lt;script&gt;alert(1)&lt;/script&gt;");
    let expression_report = report("expression(alert(1))");
    let safe_report = report("plain text");
    let sanitized = sanitize("<script>");
    let sanitized_encoded = sanitize("&lt;b&gt;encoded&lt;/b&gt;");
    let pure_summary = parse_single_line("## Tool Summary");
    let pure_sanitized = sanitize("plain text");
    let markdown_input = sample_markdown_input();
    let html_output = sample_html_output();

    if input.format.name != "markdown" { return 1; }
    if html_format().media_type != "text/html" { return 1; }
    if docx_format().name != "docx" { return 1; }
    if pdf_format().media_type != "application/pdf" { return 1; }
    if format(" Markdown ", " TEXT/MARKDOWN ").name != "markdown" { return 1; }
    if !is_supported_format(markdown_format()) { return 1; }
    if !is_supported_format(pdf_format()) { return 1; }
    if !is_valid_format(markdown_format()) { return 1; }
    if !is_valid_format(pdf_format()) { return 1; }
    if !is_valid_document_input(input) { return 1; }
    if !is_valid_document_input(pdf_input) { return 1; }
    if !is_valid_document_output(html_output) { return 1; }
    if is_supported_format(bad_format) { return 1; }
    if is_valid_format(bad_format) { return 1; }
    if is_valid_format(mismatched_format) { return 1; }
    if is_valid_format(unsafe_name_format) { return 1; }
    if is_valid_format(tab_name_format) { return 1; }
    if is_valid_format(unsafe_media_format) { return 1; }
    if is_valid_format(tab_media_format) { return 1; }
    if is_valid_format(parameter_media_format) { return 1; }
    if !options.preserve_links { return 1; }
    if !options.sanitize_html { return 1; }
    if !needs_sanitization("<p>markup</p>") { return 1; }
    if !needs_sanitization("JAVASCRIPT:alert(1)") { return 1; }
    if !needs_sanitization("VBSCRIPT:msgbox(1)") { return 1; }
    if !needs_sanitization("data:image/svg+xml,<svg onload=bad>") { return 1; }
    if !needs_sanitization("ONERROR=bad") { return 1; }
    if !needs_sanitization("onclick=bad") { return 1; }
    if !needs_sanitization("style=\"background:red\"") { return 1; }
    if !needs_sanitization("DATA:TEXT/HTML,body") { return 1; }
    if !needs_sanitization("&lt;script&gt;alert(1)&lt;/script&gt;") { return 1; }
    if !needs_sanitization("expression(alert(1))") { return 1; }
    if count_sanitization_findings("<img srcdoc=\"x\" onload=bad>") != 3 { return 1; }
    if !unsafe_report.changed { return 1; }
    if unsafe_report.removed_nodes != 2 { return 1; }
    if complex_report.removed_nodes != 3 { return 1; }
    if active_content_report.removed_nodes != 6 { return 1; }
    if encoded_report.removed_nodes != 1 { return 1; }
    if expression_report.removed_nodes != 1 { return 1; }
    if safe_report.changed { return 1; }
    if count_markdown_blocks(empty_line) != 0 { return 1; }
    if count_markdown_blocks(parsed_lines) != 2 { return 1; }
    if !has_heading(parsed_lines) { return 1; }
    if count_heading_level(deep_heading.ast, 6) != 1 { return 1; }
    if has_heading(too_deep_heading) { return 1; }
    if count_kind(too_deep_heading.ast, "paragraph") != 1 { return 1; }
    if has_heading(no_space_heading) { return 1; }
    if count_kind(no_space_heading.ast, "paragraph") != 1 { return 1; }
    if count_markdown_blocks(pure_summary) != 1 { return 1; }
    if !has_heading(pure_summary) { return 1; }
    if !is_valid_block(valid_block) { return 1; }
    if is_valid_block(invalid_block) { return 1; }
    if is_valid_block(multiline_block) { return 1; }
    if !ast_is_valid(model) { return 1; }
    if ast_is_valid(invalid_model) { return 1; }
    if ast_is_valid(multiline_model) { return 1; }
    if count_blocks(model) != 1 { return 1; }
    if count_kind(model, "paragraph") != 1 { return 1; }
    if path_value(markdown_input.path) != "docs/sample.md" { return 1; }
    if html_output.format.name != "html" { return 1; }
    if count_blocks(sanitized.ast) != 0 { return 1; }
    if count_blocks(sanitized_encoded.ast) != 0 { return 1; }
    if count_blocks(pure_sanitized.ast) != 0 { return 1; }
    return 0;
}

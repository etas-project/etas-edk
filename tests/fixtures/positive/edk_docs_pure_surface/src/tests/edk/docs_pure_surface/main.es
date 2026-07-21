module tests.edk.docs_pure_surface.main;

import edk.docs.convert.{docx_format, format, html_format, input_text, is_supported_format, is_valid_document_input, is_valid_document_output, is_valid_format, markdown_format, pdf_format, plain_text_format, safe_conversion_options};
import edk.docs.docx.docx_with_ast;
import edk.docs.html.trusted_html_with_ast;
import edk.docs.markdown.{block, is_valid_block, markdown_from_blocks};
import edk.docs.mocks.docs.{sample_html_output, sample_markdown, sample_markdown_input, sample_text_output};
import edk.docs.pure.doc_model.{append_block, ast_is_valid, count_blocks, count_heading_level, count_kind, one_paragraph};
import edk.docs.pure.html_sanitize.{count_sanitization_findings, needs_sanitization, report, sanitize};
import edk.docs.pure.markdown_parse.{count_markdown_blocks, has_heading, parse_lines, parse_single_line};
import edk.docs.tools.convert.{extract_markdown_summary, sanitize_html};

flow check_formats_and_inputs() -> i32 ![] {
    let options = safe_conversion_options();
    let input = input_text("# Title", markdown_format());
    let markdown_input = sample_markdown_input();
    let html_output = sample_html_output();
    let text_output = sample_text_output();
    let normalized = format(" Markdown ", " TEXT/MARKDOWN ");
    let bad_format = format("unknown", "");
    let mismatched_format = format("markdown", "text/html");
    let unsafe_name_format = format("mark/down", "text/markdown");
    let tab_name_format = format("mark\tdown", "text/markdown");
    let unsafe_media_format = format("markdown", "text/markdown\nx-bad: yes");
    let tab_media_format = format("markdown", "text/markdown\tbad");
    let parameter_media_format = format("markdown", "text/markdown;charset=utf-8");
    let pdf_input = input_text("PDF derived text", pdf_format());

    if input.format.name != "markdown" { return 0; }
    if input.text != "# Title" { return 0; }
    if markdown_input.path.value != "docs/sample.md" { return 0; }
    if html_output.path.value != "docs/sample.html" { return 0; }
    if text_output.format.name != "text" { return 0; }
    if html_format().media_type != "text/html" { return 0; }
    if plain_text_format().media_type != "text/plain" { return 0; }
    if docx_format().name != "docx" { return 0; }
    if pdf_format().media_type != "application/pdf" { return 0; }
    if normalized.name != "markdown" { return 0; }
    if normalized.media_type != "text/markdown" { return 0; }
    if !is_supported_format(markdown_format()) { return 0; }
    if !is_supported_format(docx_format()) { return 0; }
    if !is_supported_format(pdf_format()) { return 0; }
    if !is_valid_format(markdown_format()) { return 0; }
    if !is_valid_format(pdf_format()) { return 0; }
    if !is_valid_document_input(input) { return 0; }
    if !is_valid_document_input(pdf_input) { return 0; }
    if !is_valid_document_output(html_output) { return 0; }
    if !is_valid_document_output(text_output) { return 0; }
    if is_supported_format(bad_format) { return 0; }
    if is_valid_format(bad_format) { return 0; }
    if is_valid_format(mismatched_format) { return 0; }
    if is_valid_format(unsafe_name_format) { return 0; }
    if is_valid_format(tab_name_format) { return 0; }
    if is_valid_format(unsafe_media_format) { return 0; }
    if is_valid_format(tab_media_format) { return 0; }
    if is_valid_format(parameter_media_format) { return 0; }
    if !options.preserve_links { return 0; }
    if !options.sanitize_html { return 0; }
    return 1;
}

flow check_markdown_and_model() -> i32 ![] {
    let single = parse_single_line("### Section");
    let deep_heading = parse_single_line("###### Deep");
    let too_deep_heading = parse_single_line("####### Too Deep");
    let no_space_heading = parse_single_line("#NoSpace");
    let empty = parse_single_line("   ");
    let parsed = parse_lines("# Title\n\nParagraph");
    let ast = append_block(one_paragraph("One"), block("heading", "Two", 2));
    let valid_block = block("paragraph", "Manual", 0);
    let invalid_block = block("heading", "", 0);
    let multiline_block = block("paragraph", "Manual\nInjected", 0);
    let invalid_ast = append_block(one_paragraph("One"), invalid_block);
    let multiline_ast = append_block(one_paragraph("One"), multiline_block);
    let manual = markdown_from_blocks("Manual", [block("paragraph", "Manual", 0)]);
    let tool_summary = extract_markdown_summary("## Tool Summary");
    let sample = sample_markdown();
    let html = trusted_html_with_ast("<p>Manual</p>", manual.ast);
    let docx = docx_with_ast("Manual", manual.ast);

    if count_markdown_blocks(single) != 1 { return 0; }
    if !has_heading(single) { return 0; }
    if count_heading_level(deep_heading.ast, 6) != 1 { return 0; }
    if has_heading(too_deep_heading) { return 0; }
    if count_kind(too_deep_heading.ast, "paragraph") != 1 { return 0; }
    if has_heading(no_space_heading) { return 0; }
    if count_kind(no_space_heading.ast, "paragraph") != 1 { return 0; }
    if count_markdown_blocks(empty) != 0 { return 0; }
    if count_markdown_blocks(parsed) != 2 { return 0; }
    if !has_heading(parsed) { return 0; }
    if !is_valid_block(valid_block) { return 0; }
    if is_valid_block(invalid_block) { return 0; }
    if is_valid_block(multiline_block) { return 0; }
    if !ast_is_valid(ast) { return 0; }
    if ast_is_valid(invalid_ast) { return 0; }
    if ast_is_valid(multiline_ast) { return 0; }
    if count_blocks(ast) != 2 { return 0; }
    if count_kind(ast, "paragraph") != 1 { return 0; }
    if count_kind(ast, "heading") != 1 { return 0; }
    if count_markdown_blocks(manual) != 1 { return 0; }
    if count_markdown_blocks(tool_summary) != 1 { return 0; }
    if !has_heading(tool_summary) { return 0; }
    if sample.text != "# Sample" { return 0; }
    if docx.text != "Manual" { return 0; }
    if count_blocks(html.ast) != 1 { return 0; }
    if count_kind(html.ast, "paragraph") != 1 { return 0; }
    return 1;
}

flow check_html_sanitization() -> i32 ![] {
    let unsafe = report("<script>alert(1)</script>");
    let complex = report("<img srcdoc=\"x\" onload=bad>");
    let active_content = report("<iframe srcdoc=\"x\" style=\"background:url(javascript:bad)\" onclick=bad>");
    let encoded = report("&lt;script&gt;alert(1)&lt;/script&gt;");
    let expression = report("expression(alert(1))");
    let safe = report("plain text");
    let sanitized_unsafe = sanitize("<script>alert(1)</script>");
    let sanitized_encoded = sanitize("&lt;b&gt;encoded&lt;/b&gt;");
    let sanitized_safe = sanitize("plain text");
    let tool_sanitized = sanitize_html("plain text");

    if !needs_sanitization("<a href=\"javascript:bad\">x</a>") { return 0; }
    if !needs_sanitization("JAVASCRIPT:alert(1)") { return 0; }
    if !needs_sanitization("VBSCRIPT:msgbox(1)") { return 0; }
    if !needs_sanitization("data:image/svg+xml,<svg onload=bad>") { return 0; }
    if !needs_sanitization("ONERROR=bad") { return 0; }
    if !needs_sanitization("onclick=bad") { return 0; }
    if !needs_sanitization("style=\"background:red\"") { return 0; }
    if !needs_sanitization("DATA:TEXT/HTML,body") { return 0; }
    if !needs_sanitization("&lt;script&gt;alert(1)&lt;/script&gt;") { return 0; }
    if !needs_sanitization("expression(alert(1))") { return 0; }
    if count_sanitization_findings("<img srcdoc=\"x\" onload=bad>") != 3 { return 0; }
    if !unsafe.changed { return 0; }
    if unsafe.removed_nodes != 2 { return 0; }
    if !complex.changed { return 0; }
    if complex.removed_nodes != 3 { return 0; }
    if !active_content.changed { return 0; }
    if active_content.removed_nodes != 6 { return 0; }
    if !encoded.changed { return 0; }
    if encoded.removed_nodes != 1 { return 0; }
    if !expression.changed { return 0; }
    if expression.removed_nodes != 1 { return 0; }
    if safe.changed { return 0; }
    if safe.removed_nodes != 0 { return 0; }
    if count_blocks(sanitized_unsafe.ast) != 0 { return 0; }
    if count_blocks(sanitized_encoded.ast) != 0 { return 0; }
    if count_blocks(sanitized_safe.ast) != 0 { return 0; }
    if count_blocks(tool_sanitized.ast) != 0 { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![] {
    if check_formats_and_inputs() + check_markdown_and_model() + check_html_sanitization() == 3 {
        return 0;
    }
    return 1;
}

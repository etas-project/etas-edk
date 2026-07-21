module tests.edk.pdf_pure_surface.main;

import edk.pdf.citation.{citation_key, citation_keys_prefixed, citation_keys_unique, citations_valid_for_document, count_citations, is_safe_citation_key, is_valid_citation};
import edk.pdf.extract.{is_valid_metadata_text, pdf_metadata};
import edk.pdf.mocks.pdf.{document_has_page, document_page_numbers_unique, empty_document, image_ref, is_supported_image_media_type, is_valid_document, is_valid_image_ref, is_valid_metadata, is_valid_outline, is_valid_page, is_valid_text_span, outline_entry, pdf_document, pdf_page, single_page_text_document, text_span};
import edk.pdf.pure.citation_map.build;
import edk.pdf.pure.pdf_parse.{has_encryption_marker, has_pdf_header};
import edk.pdf.pure.text_layout.{contains_text, count_images, count_outline_entries, count_pages, count_text_spans, summarize_layout};
import edk.pdf.render.{default_render_options, is_supported_render_format, is_valid_render_options, render_options};
import edk.pdf.types.CitationRef;
import edk.workspace.path.workspace_path;

flow check_document_layout() -> i32 ![] {
    let path = match workspace_path("docs/report.pdf") {
        Ok(value) => value,
        Err(error) => {
            return 0;
        },
    };
    let document = single_page_text_document(path, "Report", "First cited paragraph");
    let summary = summarize_layout(document);
    let citations = build(document);
    let valid_citation = CitationRef { key = "manual-0", page = 1, text = "First cited paragraph" };
    let invalid_citation = CitationRef { key = "", page = 2, text = "" };
    let unsafe_citation = CitationRef { key = "manual/0", page = 1, text = "First cited paragraph" };
    let tab_citation = CitationRef { key = "manual\t0", page = 1, text = "First cited paragraph" };
    let duplicate_citations: Array<CitationRef> = [
        CitationRef { key = "span-0", page = 1, text = "First" },
        CitationRef { key = "span-0", page = 1, text = "Second" },
    ];
    let bad_citations: Array<CitationRef> = [
        invalid_citation,
    ];

    if document.metadata.title != "Report" { return 0; }
    if !is_valid_document(document) { return 0; }
    if !is_valid_metadata(document.metadata) { return 0; }
    if !document_page_numbers_unique(document) { return 0; }
    if !document_has_page(document, 1) { return 0; }
    if document_has_page(document, 2) { return 0; }
    if count_pages(document) != 1 { return 0; }
    if count_text_spans(document) != 1 { return 0; }
    if count_images(document) != 0 { return 0; }
    if count_outline_entries(document) != 1 { return 0; }
    if summary.page_count != 1 { return 0; }
    if summary.span_count != 1 { return 0; }
    if count_citations(citations) != 1 { return 0; }
    if citation_key("span", 0) != "span-0" { return 0; }
    if !is_safe_citation_key("span-0") { return 0; }
    if is_safe_citation_key("span/0") { return 0; }
    if is_safe_citation_key("span\t0") { return 0; }
    if !citation_keys_prefixed(citations, "span-") { return 0; }
    if citation_keys_prefixed(citations, "") { return 0; }
    if citation_keys_prefixed(citations, "span/unsafe") { return 0; }
    if !citation_keys_unique(citations) { return 0; }
    if !citations_valid_for_document(document, citations) { return 0; }
    if citation_keys_unique(duplicate_citations) { return 0; }
    if citations_valid_for_document(document, bad_citations) { return 0; }
    if !is_valid_citation(valid_citation) { return 0; }
    if is_valid_citation(invalid_citation) { return 0; }
    if is_valid_citation(unsafe_citation) { return 0; }
    if is_valid_citation(tab_citation) { return 0; }
    if !contains_text(document, "cited") { return 0; }
    if contains_text(document, "") { return 0; }
    return 1;
}

flow check_manual_mock_document() -> i32 ![] {
    let path = match workspace_path("docs/manual.pdf") {
        Ok(value) => value,
        Err(error) => {
            return 0;
        },
    };
    let span = text_span(2, "Second page text", 10, 20, 300, 40);
    let bad_span = text_span(0, "", 0, 0, 0, 0);
    let image = image_ref("img-1", 2, "image/png");
    let bad_image = image_ref("", 2, "application/pdf");
    let unsafe_image = image_ref("img-2", 2, "image/png\ntext");
    let parameter_image = image_ref("img-3", 2, "image/png;charset=utf-8");
    let empty_subtype_image = image_ref("img-4", 2, "image/");
    let unsafe_id_image = image_ref("img/../5", 2, "image/png");
    let tab_media_image = image_ref("img-6", 2, "image/png\tjpeg");
    let page = pdf_page(2, 612, 792, [span], [image]);
    let bad_page = pdf_page(2, 612, 792, [text_span(3, "Wrong page", 0, 0, 100, 20)], []);
    let overflow_page = pdf_page(2, 100, 100, [text_span(2, "Overflow", 90, 90, 20, 20)], []);
    let outline = outline_entry("Section", 2, 1);
    let bad_outline = outline_entry("", 0, 0);
    let unsafe_outline = outline_entry("Section\nInjected", 2, 1);
    let document = pdf_document(path, pdf_metadata("Manual", "Etas", 1, false), [page], [outline]);
    let mismatched_document = pdf_document(path, pdf_metadata("Manual", "Etas", 2, false), [page], [outline]);
    let duplicate_page_document = pdf_document(path, pdf_metadata("Manual", "Etas", 2, false), [page, page], [outline]);
    let missing_outline_page_document = pdf_document(path, pdf_metadata("Manual", "Etas", 1, false), [page], [outline_entry("Missing", 3, 1)]);
    let bad_metadata_document = pdf_document(path, pdf_metadata("Manual\nInjected", "Etas", 1, false), [page], [outline]);
    let empty = empty_document(path);

    if document.metadata.author != "Etas" { return 0; }
    if !is_valid_metadata_text(document.metadata.title) { return 0; }
    if is_valid_metadata_text("Manual\nInjected") { return 0; }
    if is_valid_metadata_text("Manual\tInjected") { return 0; }
    if !is_valid_text_span(span) { return 0; }
    if is_valid_text_span(bad_span) { return 0; }
    if !is_valid_image_ref(image) { return 0; }
    if is_valid_image_ref(bad_image) { return 0; }
    if is_valid_image_ref(unsafe_image) { return 0; }
    if is_valid_image_ref(parameter_image) { return 0; }
    if is_valid_image_ref(empty_subtype_image) { return 0; }
    if is_valid_image_ref(unsafe_id_image) { return 0; }
    if is_valid_image_ref(tab_media_image) { return 0; }
    if !is_supported_image_media_type("IMAGE/JPEG") { return 0; }
    if is_supported_image_media_type("image/png;name=x") { return 0; }
    if is_supported_image_media_type("image/png\tjpeg") { return 0; }
    if !is_valid_page(page) { return 0; }
    if is_valid_page(bad_page) { return 0; }
    if is_valid_page(overflow_page) { return 0; }
    if !is_valid_outline(outline) { return 0; }
    if is_valid_outline(bad_outline) { return 0; }
    if is_valid_outline(unsafe_outline) { return 0; }
    if !is_valid_document(document) { return 0; }
    if is_valid_document(mismatched_document) { return 0; }
    if is_valid_document(duplicate_page_document) { return 0; }
    if is_valid_document(missing_outline_page_document) { return 0; }
    if is_valid_document(bad_metadata_document) { return 0; }
    if !document_page_numbers_unique(document) { return 0; }
    if document_page_numbers_unique(duplicate_page_document) { return 0; }
    if !document_has_page(document, 2) { return 0; }
    if document_has_page(document, 3) { return 0; }
    if count_pages(document) != 1 { return 0; }
    if count_text_spans(document) != 1 { return 0; }
    if count_images(document) != 1 { return 0; }
    if count_outline_entries(document) != 1 { return 0; }
    if !contains_text(document, "Second") { return 0; }
    if count_pages(empty) != 0 { return 0; }
    return 1;
}

flow check_parse_and_render_options() -> i32 ![] {
    let default_options = default_render_options(1);
    let jpeg_options = render_options(2, 300, " JPEG ");
    let invalid_page = render_options(0, 144, "png");
    let invalid_dpi = render_options(1, 50, "png");
    let invalid_format = render_options(1, 144, "webp");
    let unsafe_format = render_options(1, 144, "png\njpeg");

    if !has_pdf_header("%PDF-1.7") { return 0; }
    if !has_pdf_header("%PDF-2.0\n1 0 obj") { return 0; }
    if has_pdf_header("%PDF-") { return 0; }
    if has_pdf_header("%PDF-x.y") { return 0; }
    if has_pdf_header("%PDF-1.70") { return 0; }
    if has_pdf_header("not a pdf") { return 0; }
    if !has_encryption_marker("%PDF-1.7 /Encrypt") { return 0; }
    if default_options.format != "png" { return 0; }
    if jpeg_options.format != "jpeg" { return 0; }
    if !is_supported_render_format("PNG") { return 0; }
    if !is_valid_render_options(default_options) { return 0; }
    if !is_valid_render_options(jpeg_options) { return 0; }
    if is_valid_render_options(invalid_page) { return 0; }
    if is_valid_render_options(invalid_dpi) { return 0; }
    if is_valid_render_options(invalid_format) { return 0; }
    if is_valid_render_options(unsafe_format) { return 0; }
    if is_supported_render_format("PNG\nJPEG") { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![] {
    if check_document_layout() + check_manual_mock_document() + check_parse_and_render_options() == 3 {
        return 0;
    }
    return 1;
}

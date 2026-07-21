module edk.pdf.package_smoke;

import edk.pdf.citation.{citation_key, citation_keys_prefixed, citation_keys_unique, citations_valid_for_document, count_citations, is_safe_citation_key, is_valid_citation};
import edk.pdf.extract.{is_valid_metadata_text, pdf_metadata};
import edk.pdf.mocks.pdf.{document_has_page, document_page_numbers_unique, image_ref, is_supported_image_media_type, is_valid_document, is_valid_image_ref, is_valid_metadata, is_valid_outline, is_valid_page, is_valid_text_span, outline_entry, pdf_document, pdf_page, single_page_text_document, text_span};
import edk.pdf.pure.citation_map.build;
import edk.pdf.pure.pdf_parse.{has_encryption_marker, has_pdf_header};
import edk.pdf.pure.text_layout.{contains_text, count_images, count_outline_entries, summarize_layout};
import edk.pdf.render.{default_render_options, is_supported_render_format, is_valid_render_options, render_options};
import edk.pdf.types.CitationRef;
import edk.workspace.path.{path_value, workspace_path};
import edk.workspace.types.WorkspaceRootPath;

flow sample_path(value: string) -> WorkspaceRootPath ![] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => error.path,
    };
}

flow main(args: Array<string>) -> i32 ![] {
    let path = sample_path("docs/sample.pdf");
    let document = single_page_text_document(path, "Sample", "Etas PDF text");
    let layout = summarize_layout(document);
    let citations = build(document);
    let options = default_render_options(1);
    let good_span = text_span(1, "Body", 0, 0, 100, 20);
    let bad_span = text_span(0, "", 0, 0, 0, 0);
    let good_image = image_ref("img-1", 1, " image/png ");
    let bad_image = image_ref("", 1, "application/pdf");
    let unsafe_image = image_ref("img-2", 1, "image/png\ntext");
    let parameter_image = image_ref("img-3", 1, "image/png;charset=utf-8");
    let empty_subtype_image = image_ref("img-4", 1, "image/");
    let unsafe_id_image = image_ref("img/../5", 1, "image/png");
    let tab_media_image = image_ref("img-6", 1, "image/png\tjpeg");
    let good_page = pdf_page(1, 612, 792, [good_span], [good_image]);
    let bad_page = pdf_page(1, 612, 792, [text_span(2, "Wrong page", 0, 0, 100, 20)], []);
    let overflow_page = pdf_page(1, 100, 100, [text_span(1, "Overflow", 90, 90, 20, 20)], []);
    let good_outline = outline_entry("Intro", 1, 1);
    let bad_outline = outline_entry("", 0, 0);
    let unsafe_outline = outline_entry("Intro\nInjected", 1, 1);
    let mismatched_document = pdf_document(path, pdf_metadata("Sample", "", 2, false), [good_page], [good_outline]);
    let duplicate_page_document = pdf_document(path, pdf_metadata("Sample", "", 2, false), [good_page, good_page], [good_outline]);
    let missing_outline_page_document = pdf_document(path, pdf_metadata("Sample", "", 1, false), [good_page], [outline_entry("Missing", 2, 1)]);
    let bad_metadata_document = pdf_document(path, pdf_metadata("Sample\nInjected", "", 1, false), [good_page], [good_outline]);
    let valid_citation = CitationRef { key = "manual-0", page = 1, text = "Body" };
    let invalid_citation = CitationRef { key = "", page = 2, text = "" };
    let unsafe_citation = CitationRef { key = "manual/0", page = 1, text = "Body" };
    let tab_citation = CitationRef { key = "manual\t0", page = 1, text = "Body" };
    let duplicate_citations: Array<CitationRef> = [
        CitationRef { key = "span-0", page = 1, text = "Body" },
        CitationRef { key = "span-0", page = 1, text = "Again" },
    ];
    let bad_citations: Array<CitationRef> = [
        invalid_citation,
    ];
    let invalid_dpi = render_options(1, 50, "png");
    let unsafe_format = render_options(1, 144, "png\njpeg");

    if !has_pdf_header("%PDF-1.7") { return 1; }
    if !has_pdf_header("%PDF-2.0\n1 0 obj") { return 1; }
    if has_pdf_header("%PDF-") { return 1; }
    if has_pdf_header("%PDF-x.y") { return 1; }
    if has_pdf_header("%PDF-1.70") { return 1; }
    if has_pdf_header("not-pdf") { return 1; }
    if !has_encryption_marker("%PDF-1.7 /Encrypt") { return 1; }
    if layout.page_count != 1 { return 1; }
    if layout.span_count != 1 { return 1; }
    if count_images(document) != 0 { return 1; }
    if count_outline_entries(document) != 1 { return 1; }
    if count_citations(citations) != 1 { return 1; }
    if citation_key("span", 0) != "span-0" { return 1; }
    if !is_safe_citation_key("span-0") { return 1; }
    if is_safe_citation_key("span/0") { return 1; }
    if is_safe_citation_key("span\t0") { return 1; }
    if !citation_keys_prefixed(citations, "span-") { return 1; }
    if citation_keys_prefixed(citations, "") { return 1; }
    if citation_keys_prefixed(citations, "span/unsafe") { return 1; }
    if !citation_keys_unique(citations) { return 1; }
    if !citations_valid_for_document(document, citations) { return 1; }
    if citation_keys_unique(duplicate_citations) { return 1; }
    if citations_valid_for_document(document, bad_citations) { return 1; }
    if !is_valid_citation(valid_citation) { return 1; }
    if is_valid_citation(invalid_citation) { return 1; }
    if is_valid_citation(unsafe_citation) { return 1; }
    if is_valid_citation(tab_citation) { return 1; }
    if !contains_text(document, "PDF") { return 1; }
    if contains_text(document, "") { return 1; }
    if !is_valid_document(document) { return 1; }
    if is_valid_document(mismatched_document) { return 1; }
    if is_valid_document(duplicate_page_document) { return 1; }
    if is_valid_document(missing_outline_page_document) { return 1; }
    if is_valid_document(bad_metadata_document) { return 1; }
    if !document_page_numbers_unique(document) { return 1; }
    if document_page_numbers_unique(duplicate_page_document) { return 1; }
    if !document_has_page(document, 1) { return 1; }
    if document_has_page(document, 2) { return 1; }
    if !is_valid_metadata(document.metadata) { return 1; }
    if !is_valid_metadata_text(document.metadata.title) { return 1; }
    if is_valid_metadata_text("bad\nTitle") { return 1; }
    if is_valid_metadata_text("bad\tTitle") { return 1; }
    if !is_valid_text_span(good_span) { return 1; }
    if is_valid_text_span(bad_span) { return 1; }
    if !is_valid_image_ref(good_image) { return 1; }
    if is_valid_image_ref(bad_image) { return 1; }
    if is_valid_image_ref(unsafe_image) { return 1; }
    if is_valid_image_ref(parameter_image) { return 1; }
    if is_valid_image_ref(empty_subtype_image) { return 1; }
    if is_valid_image_ref(unsafe_id_image) { return 1; }
    if is_valid_image_ref(tab_media_image) { return 1; }
    if !is_supported_image_media_type("IMAGE/JPEG") { return 1; }
    if is_supported_image_media_type("image/png;name=x") { return 1; }
    if is_supported_image_media_type("image/png\tjpeg") { return 1; }
    if !is_valid_page(good_page) { return 1; }
    if is_valid_page(bad_page) { return 1; }
    if is_valid_page(overflow_page) { return 1; }
    if !is_valid_outline(good_outline) { return 1; }
    if is_valid_outline(bad_outline) { return 1; }
    if is_valid_outline(unsafe_outline) { return 1; }
    if options.format != "png" { return 1; }
    if !is_valid_render_options(options) { return 1; }
    if is_valid_render_options(invalid_dpi) { return 1; }
    if is_valid_render_options(unsafe_format) { return 1; }
    if !is_supported_render_format("JPEG") { return 1; }
    if is_supported_render_format("PNG\nJPEG") { return 1; }
    if path_value(document.path) != "docs/sample.pdf" { return 1; }
    if document.metadata.title != "Sample" { return 1; }
    return 0;
}

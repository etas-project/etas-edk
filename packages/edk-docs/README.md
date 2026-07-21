# edk-docs

Initial source modules:

- `edk.docs.effects`
- `edk.docs.types`
- `edk.docs.errors`
- `edk.docs.markdown`
- `edk.docs.html`
- `edk.docs.docx`
- `edk.docs.convert`
- `edk.docs.pure.markdown_parse`
- `edk.docs.pure.html_sanitize`
- `edk.docs.pure.doc_model`
- `edk.docs.mocks.docs`
- `edk.docs.tools.convert`

`convert.convert`, `markdown_to_html`, and `html_to_text` expose the
package-owned `EdkDocs.convert` action boundary. No default document conversion
handler is published in this slice.

The pure/mock surface covers document format constructors, conversion options,
in-memory document input/output records, normalized format validation with
expected media-type matching, unsafe format/media token rejection, PDF-derived
text format construction, tab/parameter marker rejection in format tokens,
Markdown line classification with empty-line skipping, heading levels 1 through
6, over-deep heading rejection, no-space heading-marker rejection, document block
and AST validation including embedded newline rejection inside block text,
heading-level counting, deterministic mock documents, and conservative
case-insensitive HTML risk handling with deterministic finding counts for markup,
entity-encoded markup, script/iframe/object/embed tags, URI schemes such as
`javascript:`, `data:`, and `vbscript:`, inline event handlers, `srcdoc`,
`style`, and CSS expression markers. Pure
`extract_markdown_summary` and `sanitize_html` tool delegation is covered by
source fixtures rather than by the executable package smoke entry, because
tools are model-callable boundaries and are not ordinary runtime call targets.
`HtmlDocument` carries both an opaque `Sanitized<string>` value and the
corresponding sanitized text used by action-backed conversion inputs; EDK does
not unwrap `Sanitized` as an ordinary string.
The HTML sanitizer does not pretend to structurally rewrite HTML; without a
parser/rewriter substrate it only preserves plain text and returns an empty
sanitized document when markup or unsafe markers are detected. `convert_document`
is not part of the pure surface because it exposes `EdkDocs.convert`.

Package-mode verification now passes with `etas pkg update .`, `etas pkg lock
.`, `etas check --all .`, and `etas run .`. This verifies the source package
and pure package smoke flow; it does not publish a native DOCX/PDF converter,
byte/text codec shortcut, or file runtime handler.

File conversion remains pending because byte/text codecs and package metadata
for path-scoped `EdkWorkspace.read/write` are not yet available through the EDK
source surface. PDF inputs must continue through `edk-pdf`; this package does
not duplicate PDF parsing.

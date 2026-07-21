# edk-pdf

Initial source modules:

- `edk.pdf.effects`
- `edk.pdf.types`
- `edk.pdf.errors`
- `edk.pdf.extract`
- `edk.pdf.render`
- `edk.pdf.citation`
- `edk.pdf.pure.pdf_parse`
- `edk.pdf.pure.text_layout`
- `edk.pdf.pure.citation_map`
- `edk.pdf.mocks.pdf`
- `edk.pdf.tools.pdf`

`extract.extract_text` and `citation.citations` perform the package-owned
`EdkPdf.read` action and declare the underlying `EdkWorkspace.read` requirement
in their public effect rows. No default PDF parser or renderer is published in
this slice.

The pure/mock surface covers deterministic PDF metadata, page, text span,
image reference, outline, document, citation-map, text-layout, PDF header, and
render-option helpers. It now includes supported-version PDF header validation,
malformed/incomplete header rejection, mock document validators for page counts,
unique page numbers, span/image/page/outline shape, outline page references,
image media types, unsafe image identifier rejection, metadata and outline title
control-character rejection, citation shape, citation key token validation
including tab/URL-token rejection, citation key uniqueness, citation page
references, empty/unsafe citation-prefix rejection, render format
control-character rejection, empty text-search rejection, unsafe image
media-type token rejection, and text-span page-boundary validation.
These helpers are source-level fixtures and data-model utilities; they do not
parse native PDF bytes or render PDF graphics.

The current action family form is `EdkPdf.read`. Path authority is carried by
checked `WorkspacePath` payload evidence and workspace policy metadata rather
than by a runtime path value in action type arguments. The gap is tracked in
`std-requirements/substrate-gaps.md`.

Package-mode verification now passes with `etas pkg update .`, `etas pkg lock
.`, `etas check --all .`, and `etas run .`. This verifies the source package
and pure package smoke flow; it does not publish a native PDF parser, renderer,
or file runtime handler.

`render_page` remains pending because page rendering requires font, image, and
PDF graphics substrate. `render.es` currently contains render option builders
only.

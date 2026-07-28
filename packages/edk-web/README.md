# edk-web

Initial source modules:

- `edk.web.effects`
- `edk.web.types`
- `edk.web.errors`
- `edk.web.search`
- `edk.web.fetch`
- `edk.web.crawl`
- `edk.web.trust`
- `edk.web.pure.html_extract`
- `edk.web.pure.robots`
- `edk.web.pure.canonical_url`
- `edk.web.mocks.search_index`
- `edk.web.tools.search`
- `edk.web.tools.fetch`

`search`, `fetch`, and `crawl` perform package-owned `EdkWeb.*` actions and
return untrusted wrapper types where external content crosses into Etas. No
default network, provider, search, or crawl handler is published in this slice.

The current action family form is `EdkWeb.fetch` and `EdkWeb.crawl`. Domain
authority is runtime URL payload data until package metadata can publish
payload-aware policies or a typed static selector. The gap is tracked in
`tests/std-requirements/substrate-gaps.md`.

HTTP-backed provider handlers are intentionally pending. `fetch.page_from_http`
is a pure decoder helper over an already supplied `HttpResponse`; it is not a
default fetch handler.

`edk.web.package_smoke` now covers deterministic URL canonicalization that
normalizes scheme/host/path, preserves query strings, and removes fragments,
same-origin/domain checks including cross-scheme same-domain cases,
HTML/media-type detection, robots allow/deny decisions including prefix rules,
case-insensitive directives, comments, empty rule handling, and more-specific
allow/deny precedence, crawl constructors and limit/robots validation, fetch
option validation, conservative case-insensitive HTML risk handling for active
content markers, response-to-page conversion, and explicit case-insensitive
mock search filtering with provider/text/language query validation and limit
enforcement.
Provider and language tokens are intentionally conservative and reject path,
authority, and control separators. The mock module also exposes deterministic
untrusted page and crawl-result constructors for fetch/crawl fixtures; these
are data constructors, not fetch or crawl handlers. Nested URL fields in
`edk.web.types` use `edk.http.types.Url` directly so web pages, search results,
crawl results, and sanitizer records preserve explicit URL authority including
ports.
`trust.sanitize_html` does not structurally rewrite HTML; without a
parser/rewriter substrate it only preserves plain text and returns an empty
sanitized value when markup or active-content markers are detected. Empty search
queries are invalid and the deterministic mock search returns no results for
them rather than treating an empty string as a full-index match. The fixture
`tests/fixtures/positive/edk_web_pure_surface` mirrors that pure surface for
downstream package-style consumption and now passes package-mode
`pkg update`, `pkg lock`, `check`, and `run`.

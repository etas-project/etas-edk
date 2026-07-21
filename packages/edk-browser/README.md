# edk-browser

Initial source modules:

- `edk.browser.effects`
- `edk.browser.types`
- `edk.browser.errors`
- `edk.browser.page`
- `edk.browser.session`
- `edk.browser.selector`
- `edk.browser.screenshot`
- `edk.browser.pure.selector_parse`
- `edk.browser.pure.dom_snapshot`

`session.create_session`, `session.attach_session`, `page.navigate`,
`page.click`, and `page.read` perform package-owned `EdkBrowser.*` actions.
`BrowserSessionRef` is a bodyless nominal handle: production source cannot
construct one from a string, and the value must come from a trusted
package/runtime binding. No default browser/WebDriver/CDP handler is published
yet because browser protocol and WebSocket substrate are still missing.
`Url` is also a checked evidence value: `UrlSpec` is the raw shape, while
`url(...)` and `https(...)` validate scheme, host, and path before returning
`Result<Url, BrowserError>`.
`page.navigate` and `page.read` consume values through the `BrowserSession`
spec, and `page.click` consumes both `BrowserSession` and `ParsedSelector`
evidence. Tool wrappers carry the same spec-bound target surface; concrete
`BrowserSessionRef` / `Selector` types appear as evidence implementations, not
as wrapper shortcuts. If the current compiler or package metadata cannot check
those source-bodied generic tools, that is recorded as tooling blocker rather
than weakening the EDK API.

`edk.browser.mocks.mock_session` is also no longer a string-backed fake
constructor for the production browser handle. It validates test input and
performs `EdkBrowserMock.session`, which materializes a separate
`MockBrowserSessionRef`. That mock handle implements only `MockBrowserSession`;
it does not implement the production `BrowserSession` spec and cannot be used
to call `page.navigate`, `page.click`, `page.read`, or production tool wrappers.

Domain/origin payload-aware policies are pending package-defined action
metadata; the current source keeps the session/url/selector as action
arguments. `EdkBrowser.navigate`, `EdkBrowser.click`, and `EdkBrowser.read`
use the package action family directly in public rows; session, URL, and
selector values stay in the runtime action payload and trace-spec checks.

Package-mode `check` passes for this target surface. Package-mode `run` still
fails closed until a real browser/Network host service can materialize
production opaque handles without degrading them to strings.

`edk.browser.package_smoke` now covers checked URL construction through
`Result<Url, BrowserError>`, checked selector construction through
`Result<Selector, SelectorError>`, selector predicates, text selector prefix
normalization, empty selector rejection, CR/LF selector rejection, URL path
normalization, conservative URL host/scheme/path validation including rejection
of raw spaces, tabs, fragments, backslashes, and embedded absolute URLs in
paths, profile validation, normalized-origin validation, navigation/click
options, DOM summary helpers, empty text-containment rejection, screenshot
request/reference shape validation, and deterministic mock snapshots. Selector
parsing no longer returns a `SelectorParseResult` containing an invalid fallback
selector; failure stays in `Err`. Host and origin validation currently accepts
scheme plus conservative DNS-style host labels only; full origin scope metadata
with explicit port handling remains part of the package-defined action scope
metadata gap above. The fixture
`tests/fixtures/positive/edk_browser_pure_surface` mirrors that intended
surface for downstream package-style consumption. It remains blocked by the
same package/runtime opaque-handle binding gap rather than by a EDK source fake.
The smoke and fixture use sequential guard assertions to avoid the current
long-boolean lowering blocker.

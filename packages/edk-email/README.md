# edk-email

Initial source modules:

- `edk.email.effects`
- `edk.email.types`
- `edk.email.errors`
- `edk.email.address`
- `edk.email.message`
- `edk.email.smtp`
- `edk.email.provider`
- `edk.email.pure.rfc5322`
- `edk.email.pure.mime`
- `edk.email.pure.address_parse`
- `edk.email.mocks.mailbox`
- `edk.email.tools.mail`

`provider.send` and `provider.read` perform package-owned `EdkEmail.send` and
`EdkEmail.read` actions. They validate checked account evidence plus draft or
mailbox-query data before requesting those actions; invalid source data raises
`Error<EmailError>` instead of reaching the action boundary. No default SMTP,
provider, or delivery handler is published in this slice.

The current action family form is `EdkEmail.send<A>` for recipient evidence and
`EdkEmail.read` for mailbox reads. `EmailAccount` remains payload data until
EDK introduces checked account selectors and package metadata can publish them.
The gap is tracked in `tests/std-requirements/substrate-gaps.md`.

SMTP execution is intentionally not implemented because public stream/TLS
substrate is not available yet. Provider-specific HTTP execution remains a host
adapter/package-binding concern and must not be hidden behind a default EDK
handler.

Package-mode verification is currently blocked by the nominal HTTP dependency
metadata path: `edk-email` depends on `edk-http`, and `edk-http` now uses
nominal URL/header evidence types that the current package manager cannot yet
materialize. This is not a license to weaken the email API back to raw strings
or to publish a fake SMTP/provider handler.

`edk.email.package_smoke` now covers valid/invalid addresses, checked account
evidence, pure draft construction, whole-draft validation, draft idempotency
field validation and propagation, required-header validation, safe header name/value/subject checks,
CR/LF address rejection, conservative domain-label/local-part rejection, MIME
text/html helpers, mailbox query limit/token validation, checked SMTP/provider
endpoint evidence, and deterministic mock mailbox filtering/receipt helpers.
Recipient APIs now use capability evidence: `EmailDraft<A ~
DeliverableAddress>` carries recipient evidence through `to` / `cc` / `bcc`,
and `draft(...)`, `draft_to_one(...)`, `with_cc(...)`, `with_bcc(...)`, MIME
helpers, receipts, `send(...)`, and the source-bodied tool wrappers preserve
the same `A`. If tool metadata cannot publish that generic capability boundary
yet, verification is blocked rather than falling back to non-parameterized
drafts.
Email accounts, provider endpoints, and headers now use nominal evidence:
`EmailAccountSpec` / `ProviderEndpointSpec` / `EmailHeaderSpec<N>` are raw
shapes, while `EmailAccount`, `ProviderEndpoint`, and
`EmailHeader<N ~ UserSettableEmailHeader>` are checked evidence values.
`EmailHeader<N ~ UserSettableEmailHeader>` carries the checked header-name
evidence type, `UserEmailHeader` is the production draft/header storage alias,
`EmailHeaderName` and `EmailHeaderValue` are produced by checked constructors,
and `header<N ~ UserSettableEmailHeader>(...)` accepts only evidence values.
Public accessors expose header evidence as text via
`email_header_name_value(...)` / `email_header_value_text(...)`; raw helper
names remain private implementation details. `email_account(...)`,
`provider_endpoint(...)`, and `parse_header(...)` reject invalid inputs instead
of constructing fake fallback evidence.
Address and authority-token validation is intentionally conservative: it
rejects whitespace/control injection, obvious mailbox/header separators, missing
domain dots, empty local/domain dot segments, domain labels with
leading/trailing hyphens, and unsafe provider/SMTP host labels. Pure
`draft_email` tool delegation is covered by source fixtures rather than by the
executable package smoke entry, because tools are model-callable boundaries and
are not ordinary runtime call targets.
The fixture `tests/fixtures/positive/edk_email_pure_surface` mirrors that pure
surface for downstream package-style consumption. It is source-updated for
checked `EmailAddress`, `EmailAccount`, `ProviderEndpoint`, and email header
evidence construction, but package-mode verification is blocked until
dependency metadata for the nominal HTTP surface can be produced. Source-only
checking is additionally blocked on frontend support for imported
representation-backed nominal constructor and accessor facts for the new
address/account/provider/header evidence types, applied nominal record
construction/access for `EmailHeader<N ~ UserSettableEmailHeader>`,
parameterized `EmailDraft<A ~ DeliverableAddress>` record construction/access,
and `EdkEmail.send<A>` action metadata; the EDK source should not be weakened
back to raw strings or non-parameterized drafts to work around those frontend
gaps.

Send replay/idempotency metadata remains blocked separately from the draft data
field; see `tests/blocked/edk-email-send-replay-metadata.txt`.

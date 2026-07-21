module edk.email.types;

public alias EmailAddressSpec = {
    display_name: string,
    address: string,
    local_part: string,
    domain: string,
};

public type EmailAddress = EmailAddressSpec;

public spec DeliverableAddress;

impl EmailAddress ~ DeliverableAddress;

public alias EmailAccountSpec = {
    id: string,
    provider: string,
    address: EmailAddress,
};

public type EmailAccount = EmailAccountSpec;

public spec EmailAccountTarget;

impl EmailAccount ~ EmailAccountTarget;

public type EmailHeaderName = {
    value: string,
};

public type EmailHeaderValue = {
    value: string,
};

public spec UserSettableEmailHeader;

impl EmailHeaderName ~ UserSettableEmailHeader;

public alias EmailHeaderSpec<N ~ UserSettableEmailHeader> = {
    name: N,
    value: EmailHeaderValue,
};

public type EmailHeader<N ~ UserSettableEmailHeader> = EmailHeaderSpec<N>;

public alias UserEmailHeader = EmailHeader<EmailHeaderName>;

public alias EmailAttachment = {
    name: string,
    media_type: string,
    body: bytes,
};

public alias EmailDraft<A ~ DeliverableAddress> = {
    to: Array<A>,
    cc: Array<A>,
    bcc: Array<A>,
    subject: string,
    text_body: string,
    html_body: string,
    headers: Array<UserEmailHeader>,
    attachments: Array<EmailAttachment>,
    idempotency_key: string,
};

public alias EmailMessage = {
    id: string,
    account: EmailAccount,
    from: EmailAddress,
    to: Array<EmailAddress>,
    subject: string,
    text_body: string,
    received_at: string,
    headers: Array<UserEmailHeader>,
    attachments: Array<EmailAttachment>,
};

public alias EmailReceipt = {
    account: EmailAccount,
    provider_message_id: string,
    accepted: bool,
    idempotency_key: string,
};

public alias EmailQuery = {
    mailbox: string,
    search: string,
    limit: i32,
    cursor: string,
};

public alias MailboxPage = {
    messages: Array<EmailMessage>,
    next_cursor: string,
    done: bool,
};

public alias MimePart = {
    media_type: string,
    text: string,
    headers: Array<UserEmailHeader>,
    attachments: Array<EmailAttachment>,
};

public alias MimeEncodeResult = {
    ok: bool,
    media_type: string,
    text: string,
    message: string,
};

public alias SmtpEndpoint = {
    host: string,
    port: i32,
    tls: bool,
};

public type TlsSmtpEndpoint = SmtpEndpoint;

public spec TlsRequiredEndpoint;

impl TlsSmtpEndpoint ~ TlsRequiredEndpoint;

public alias ProviderEndpointSpec = {
    name: string,
    api_host: string,
};

public type ProviderEndpoint = ProviderEndpointSpec;

public spec EmailProviderEndpointTarget;

impl ProviderEndpoint ~ EmailProviderEndpointTarget;

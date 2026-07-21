module edk.email.message;

import std.text.{contains, lowercase, trim};
import edk.email.errors.EmailError;
import edk.email.pure.rfc5322.{has_required_headers, has_safe_headers, is_safe_header_name, is_safe_header_value};
import edk.email.types.{DeliverableAddress, EmailAddress, EmailAttachment, EmailDraft, EmailHeader, EmailHeaderName, EmailHeaderSpec, EmailHeaderValue, EmailQuery, UserEmailHeader, UserSettableEmailHeader};

flow email_error(code: string, message: string) -> EmailError ![] {
    return EmailError {
        code = code,
        message = message,
    };
}

flow raw_header_name(name: EmailHeaderName) -> string ![] {
    return name.value;
}

flow raw_header_value(value: EmailHeaderValue) -> string ![] {
    return value.value;
}

public flow email_header_name_value(name: EmailHeaderName) -> string ![] {
    return raw_header_name(name);
}

public flow email_header_value_text(value: EmailHeaderValue) -> string ![] {
    return raw_header_value(value);
}

public flow is_managed_header_name(name: string) -> bool ![] {
    let normalized = lowercase(trim(name));
    return normalized == "to"
        || normalized == "from"
        || normalized == "cc"
        || normalized == "bcc"
        || normalized == "subject"
        || normalized == "date"
        || normalized == "message-id"
        || normalized == "mime-version"
        || normalized == "content-type"
        || normalized == "content-transfer-encoding";
}

public flow header_name(name: string) -> Result<EmailHeaderName, EmailError> ![] {
    if !is_safe_header_name(name) {
        return Err(email_error("invalid_header_name", "invalid email header name"));
    }
    if is_managed_header_name(name) {
        return Err(email_error("managed_header", "managed email header cannot be user-set"));
    }
    return Ok(EmailHeaderName {
        value = lowercase(trim(name)),
    });
}

public flow header_value(value: string) -> Result<EmailHeaderValue, EmailError> ![] {
    if !is_safe_header_value(value) {
        return Err(email_error("invalid_header_value", "invalid email header value"));
    }
    return Ok(EmailHeaderValue {
        value = value,
    });
}

flow raw_header_spec<N ~ UserSettableEmailHeader>(name: N, value: EmailHeaderValue) -> EmailHeaderSpec<N> ![] {
    return EmailHeaderSpec<N> {
        name = name,
        value = value,
    };
}

public flow header<N ~ UserSettableEmailHeader>(name: N, value: EmailHeaderValue) -> EmailHeader<N> ![] {
    return EmailHeader<N> {
        name = name,
        value = value,
    };
}

public flow header_spec<N ~ UserSettableEmailHeader>(item: EmailHeader<N>) -> EmailHeaderSpec<N> ![] {
    return EmailHeaderSpec<N> {
        name = item.name,
        value = item.value,
    };
}

public flow parse_header(name: string, value: string) -> Result<UserEmailHeader, EmailError> ![] {
    let parsed_name = header_name(name);
    let parsed_value = header_value(value);
    match parsed_name {
        Err(error) => {
            return Err(error);
        }
        Ok(safe_name) => {
            match parsed_value {
                Err(error) => {
                    return Err(error);
                }
                Ok(safe_value) => {
                    return Ok(header(safe_name, safe_value));
                }
            }
        }
    }
}

public flow empty_headers() -> Array<UserEmailHeader> ![] {
    let headers: Array<UserEmailHeader> = [];
    return headers;
}

public flow draft<A ~ DeliverableAddress>(to: Array<A>, subject: string, body: string) -> EmailDraft<A> ![] {
    let cc: Array<A> = [];
    let bcc: Array<A> = [];
    let attachments: Array<EmailAttachment> = [];
    return EmailDraft<A> {
        to = to,
        cc = cc,
        bcc = bcc,
        subject = trim(subject),
        text_body = body,
        html_body = "",
        headers = empty_headers(),
        attachments = attachments,
        idempotency_key = "",
    };
}

public flow draft_to_one<A ~ DeliverableAddress>(to: A, subject: string, body: string) -> EmailDraft<A> ![] {
    let recipients: Array<A> = [to];
    return draft(recipients, subject, body);
}

public flow with_cc<A ~ DeliverableAddress>(draft: EmailDraft<A>, cc: Array<A>) -> EmailDraft<A> ![] {
    return EmailDraft<A> {
        to = draft.to,
        cc = cc,
        bcc = draft.bcc,
        subject = draft.subject,
        text_body = draft.text_body,
        html_body = draft.html_body,
        headers = draft.headers,
        attachments = draft.attachments,
        idempotency_key = draft.idempotency_key,
    };
}

public flow with_bcc<A ~ DeliverableAddress>(draft: EmailDraft<A>, bcc: Array<A>) -> EmailDraft<A> ![] {
    return EmailDraft<A> {
        to = draft.to,
        cc = draft.cc,
        bcc = bcc,
        subject = draft.subject,
        text_body = draft.text_body,
        html_body = draft.html_body,
        headers = draft.headers,
        attachments = draft.attachments,
        idempotency_key = draft.idempotency_key,
    };
}

public flow with_header<A ~ DeliverableAddress>(draft: EmailDraft<A>, item: UserEmailHeader) -> EmailDraft<A> ![] {
    return EmailDraft<A> {
        to = draft.to,
        cc = draft.cc,
        bcc = draft.bcc,
        subject = draft.subject,
        text_body = draft.text_body,
        html_body = draft.html_body,
        headers = draft.headers.push(item),
        attachments = draft.attachments,
        idempotency_key = draft.idempotency_key,
    };
}

public flow with_idempotency_key<A ~ DeliverableAddress>(draft: EmailDraft<A>, key: string) -> EmailDraft<A> ![] {
    return EmailDraft<A> {
        to = draft.to,
        cc = draft.cc,
        bcc = draft.bcc,
        subject = draft.subject,
        text_body = draft.text_body,
        html_body = draft.html_body,
        headers = draft.headers,
        attachments = draft.attachments,
        idempotency_key = trim(key),
    };
}

public flow with_html_body<A ~ DeliverableAddress>(draft: EmailDraft<A>, html: string) -> EmailDraft<A> ![] {
    return EmailDraft<A> {
        to = draft.to,
        cc = draft.cc,
        bcc = draft.bcc,
        subject = draft.subject,
        text_body = draft.text_body,
        html_body = html,
        headers = draft.headers,
        attachments = draft.attachments,
        idempotency_key = draft.idempotency_key,
    };
}

public flow mailbox_query(mailbox: string, search: string, limit: i32) -> EmailQuery ![] {
    return EmailQuery {
        mailbox = trim(mailbox),
        search = trim(search),
        limit = limit,
        cursor = "",
    };
}

public flow with_cursor(query: EmailQuery, cursor: string) -> EmailQuery ![] {
    return EmailQuery {
        mailbox = query.mailbox,
        search = query.search,
        limit = query.limit,
        cursor = cursor,
    };
}

public flow is_valid_idempotency_key(key: string) -> bool ![] {
    let value = trim(key);
    return value != ""
        && !contains(value, " ")
        && !contains(value, "/")
        && !contains(value, "\\")
        && !contains(value, ":")
        && !contains(value, "?")
        && !contains(value, "#")
        && !contains(value, "\t")
        && !contains(value, "\n")
        && !contains(value, "\r");
}

public flow is_valid_email_draft<A ~ DeliverableAddress>(draft: EmailDraft<A>) -> bool ![] {
    return has_required_headers(draft)
        && has_safe_headers(draft)
        && is_valid_idempotency_key(draft.idempotency_key);
}

flow is_safe_mailbox_name(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, ":")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

flow is_safe_cursor(value: string) -> bool ![] {
    let normalized = trim(value);
    return !contains(normalized, " ")
        && !contains(normalized, "\\")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

public flow is_valid_mailbox_query(query: EmailQuery) -> bool ![] {
    return is_safe_mailbox_name(query.mailbox)
        && query.limit > 0
        && query.limit <= 1000
        && !contains(query.search, "\n")
        && !contains(query.search, "\r")
        && is_safe_cursor(query.cursor);
}

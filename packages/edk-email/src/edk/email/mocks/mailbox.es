module edk.email.mocks.mailbox;

import std.text.contains;
import edk.email.message.is_valid_mailbox_query;
import edk.email.types.{DeliverableAddress, EmailAccount, EmailAddress, EmailAttachment, EmailDraft, EmailMessage, EmailQuery, EmailReceipt, MailboxPage, UserEmailHeader};

public flow empty_mailbox_page() -> MailboxPage ![] {
    let messages: Array<EmailMessage> = [];
    return MailboxPage {
        messages = messages,
        next_cursor = "",
        done = true,
    };
}

public flow mailbox_page(messages: Array<EmailMessage>, next_cursor: string) -> MailboxPage ![] {
    return MailboxPage {
        messages = messages,
        next_cursor = next_cursor,
        done = next_cursor == "",
    };
}

public flow count_messages(messages: Array<EmailMessage>) -> i32 ![] {
    var total = 0;
    for message in messages limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow count_page_messages(page: MailboxPage) -> i32 ![] {
    return count_messages(page.messages);
}

public flow email_message(account: EmailAccount, id: string, from: EmailAddress, to: Array<EmailAddress>, subject: string, body: string) -> EmailMessage ![] {
    let headers: Array<UserEmailHeader> = [];
    let attachments: Array<EmailAttachment> = [];
    return EmailMessage {
        id = id,
        account = account,
        from = from,
        to = to,
        subject = subject,
        text_body = body,
        received_at = "",
        headers = headers,
        attachments = attachments,
    };
}

public flow accepted_receipt<A ~ DeliverableAddress>(account: EmailAccount, draft: EmailDraft<A>, provider_message_id: string) -> EmailReceipt ![] {
    return EmailReceipt {
        account = account,
        provider_message_id = provider_message_id,
        accepted = true,
        idempotency_key = draft.idempotency_key,
    };
}

public flow filter_messages(query: EmailQuery, messages: Array<EmailMessage>) -> MailboxPage ![] {
    var matches: Array<EmailMessage> = [];
    if !is_valid_mailbox_query(query) {
        return empty_mailbox_page();
    }

    var matched = 0;
    for message in messages limit Iterations(65536) {
        if query.limit > 0
            && matched < query.limit
            && (query.search == "" || contains(message.subject, query.search) || contains(message.text_body, query.search))
        {
            matches = matches.push(message);
            matched = matched + 1;
        }
    }
    return mailbox_page(matches, "");
}

module edk.email.tools.mail;

import edk.email.message.{draft_to_one, mailbox_query};
import edk.email.provider.{read, send};
import edk.email.effects.EdkEmail;
import edk.email.errors.EmailError;
import edk.email.types.{DeliverableAddress, EmailAccount, EmailDraft, EmailMessage, EmailQuery, EmailReceipt};

public tool draft_email<A ~ DeliverableAddress>(to: A, subject: string, body: string) -> EmailDraft<A> ![] {
    return draft_to_one(to, subject, body);
}

public tool send_email<A ~ DeliverableAddress>(account: EmailAccount, draft: EmailDraft<A>) -> EmailReceipt ![EdkEmail.send<A>, Error<EmailError>] {
    return send(account, draft);
}

public tool search_mailbox(account: EmailAccount, mailbox: string, search: string, limit: i32) -> Array<EmailMessage> ![EdkEmail.read, Error<EmailError>] {
    let query: EmailQuery = mailbox_query(mailbox, search, limit);
    return read(account, query);
}

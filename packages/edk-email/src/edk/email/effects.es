module edk.email.effects;

import edk.email.types.{DeliverableAddress, EmailAccount, EmailDraft, EmailMessage, EmailQuery, EmailReceipt};

public effect EdkEmail extends Network {
    action send<A ~ DeliverableAddress>(account: EmailAccount, draft: EmailDraft<A>) -> EmailReceipt;
    action read(account: EmailAccount, query: EmailQuery) -> Array<EmailMessage>;
}

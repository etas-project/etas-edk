module edk.email.pure.mime;

import edk.email.pure.rfc5322.{has_required_headers, has_safe_headers};
import edk.email.types.{DeliverableAddress, EmailDraft, MimeEncodeResult, MimePart};

public flow text_part<A ~ DeliverableAddress>(draft: EmailDraft<A>) -> MimePart ![] {
    return MimePart {
        media_type = "text/plain",
        text = draft.text_body,
        headers = draft.headers,
        attachments = draft.attachments,
    };
}

public flow encode_text<A ~ DeliverableAddress>(draft: EmailDraft<A>) -> MimeEncodeResult ![] {
    if !has_required_headers(draft) {
        return MimeEncodeResult {
            ok = false,
            media_type = "text/plain",
            text = draft.text_body,
            message = "missing required email headers",
        };
    }

    if !has_safe_headers(draft) {
        return MimeEncodeResult {
            ok = false,
            media_type = "text/plain",
            text = draft.text_body,
            message = "unsafe email headers",
        };
    }

    return MimeEncodeResult {
        ok = true,
        media_type = "text/plain",
        text = draft.text_body,
        message = "",
    };
}

public flow html_part<A ~ DeliverableAddress>(draft: EmailDraft<A>) -> MimePart ![] {
    return MimePart {
        media_type = "text/html",
        text = draft.html_body,
        headers = draft.headers,
        attachments = draft.attachments,
    };
}

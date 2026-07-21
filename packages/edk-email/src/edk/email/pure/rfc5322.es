module edk.email.pure.rfc5322;

import std.text.{contains, join, trim};
import edk.email.address.{email_address_value, is_valid_address};
import edk.email.types.{DeliverableAddress, EmailAddress, EmailDraft, EmailHeaderName, EmailHeaderSpec, EmailHeaderValue, UserEmailHeader};

flow raw_header_name(name: EmailHeaderName) -> string ![] {
    return name.value;
}

flow raw_header_value(value: EmailHeaderValue) -> string ![] {
    return value.value;
}

flow user_header_spec(item: UserEmailHeader) -> EmailHeaderSpec<EmailHeaderName> ![] {
    return EmailHeaderSpec<EmailHeaderName> {
        name = item.name,
        value = item.value,
    };
}

public flow has_required_headers<A ~ DeliverableAddress>(draft: EmailDraft<A>) -> bool ![] {
    var recipients = 0;
    for recipient in draft.to limit Iterations(65536) {
        recipients = recipients + 1;
    }
    return draft.subject != "" && recipients > 0;
}

public flow is_safe_header_name(name: string) -> bool ![] {
    let normalized = trim(name);
    return normalized != ""
        && !contains(normalized, ":")
        && !contains(normalized, " ")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r")
        && !contains(normalized, "(")
        && !contains(normalized, ")")
        && !contains(normalized, "<")
        && !contains(normalized, ">")
        && !contains(normalized, "@")
        && !contains(normalized, ",")
        && !contains(normalized, ";")
        && !contains(normalized, "\\")
        && !contains(normalized, "/")
        && !contains(normalized, "[")
        && !contains(normalized, "]")
        && !contains(normalized, "?")
        && !contains(normalized, "=");
}

public flow is_safe_header_value(value: string) -> bool ![] {
    let normalized = trim(value);
    return !contains(normalized, "\n") && !contains(normalized, "\r");
}

public flow is_safe_display_name(value: string) -> bool ![] {
    let normalized = trim(value);
    return !contains(normalized, "\n")
        && !contains(normalized, "\r")
        && !contains(normalized, "<")
        && !contains(normalized, ">")
        && !contains(normalized, ",")
        && !contains(normalized, ";");
}

public flow has_safe_headers<A ~ DeliverableAddress>(draft: EmailDraft<A>) -> bool ![] {
    if !is_safe_header_value(draft.subject) {
        return false;
    }
    for item in draft.headers limit Iterations(65536) {
        let spec = user_header_spec(item);
        if !is_safe_header_name(raw_header_name(spec.name)) || !is_safe_header_value(raw_header_value(spec.value)) {
            return false;
        }
    }
    return true;
}

public flow format_mailbox(address: EmailAddress) -> string ![] {
    let value = email_address_value(address);
    if value.display_name == "" {
        return value.address;
    }
    let parts: Array<string> = [value.display_name, value.address];
    return join(parts, " ");
}

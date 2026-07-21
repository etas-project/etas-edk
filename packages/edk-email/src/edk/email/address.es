module edk.email.address;

import std.text.{contains, lowercase, split, starts_with, trim};
import edk.email.errors.{AddressError, EmailError};
import edk.email.types.{EmailAccount, EmailAccountSpec, EmailAddress, EmailAddressSpec};

flow raw_email_address(display_name: string, address: string) -> EmailAddressSpec ![] {
    let normalized = lowercase(trim(address));
    var local = "";
    var domain = "";
    var index = 0;
    for part in split(normalized, "@") limit Iterations(16) {
        if index == 0 {
            local = part;
        }
        if index == 1 {
            domain = part;
        }
        index = index + 1;
    }
    return EmailAddressSpec {
        display_name = trim(display_name),
        address = normalized,
        local_part = local,
        domain = domain,
    };
}

flow raw_email_address_ref(address: EmailAddressSpec) -> EmailAddress ![] {
    return EmailAddress {
        display_name = address.display_name,
        address = address.address,
        local_part = address.local_part,
        domain = address.domain,
    };
}

public flow email_address_value(address: EmailAddress) -> EmailAddressSpec ![] {
    return EmailAddressSpec {
        display_name = address.display_name,
        address = address.address,
        local_part = address.local_part,
        domain = address.domain,
    };
}

flow address_error(input: string, message: string) -> AddressError ![] {
    return AddressError {
        input = input,
        message = message,
    };
}

flow email_error(code: string, message: string) -> EmailError ![] {
    return EmailError {
        code = code,
        message = message,
    };
}

public flow parse_address(value: string) -> Result<EmailAddress, AddressError> ![] {
    let address = raw_email_address("", value);
    if !is_valid_address_spec(address) {
        return Err(address_error(value, "invalid email address"));
    }
    return Ok(raw_email_address_ref(address));
}

public flow email_address(display_name: string, address: string) -> Result<EmailAddress, AddressError> ![] {
    let parsed = raw_email_address(display_name, address);
    if !is_valid_address_spec(parsed) {
        return Err(address_error(address, "invalid email address"));
    }
    return Ok(raw_email_address_ref(parsed));
}

flow ends_with_text(value: string, suffix: string) -> bool ![] {
    if suffix == "" {
        return true;
    }
    if !contains(value, suffix) {
        return false;
    }
    var last = value;
    for part in split(value, suffix) limit Iterations(65536) {
        last = part;
    }
    return last == "";
}

flow has_unsafe_mailbox_text(value: string) -> bool ![] {
    return contains(value, " ")
        || contains(value, "\t")
        || contains(value, "\n")
        || contains(value, "\r")
        || contains(value, "<")
        || contains(value, ">")
        || contains(value, "(")
        || contains(value, ")")
        || contains(value, "[")
        || contains(value, "]")
        || contains(value, ",")
        || contains(value, ";")
        || contains(value, ":")
        || contains(value, "\\");
}

public flow is_valid_address(address: EmailAddress) -> bool ![] {
    return is_valid_address_spec(email_address_value(address));
}

public flow is_valid_address_spec(address: EmailAddressSpec) -> bool ![] {
    var parts = 0;
    for part in split(address.address, "@") limit Iterations(16) {
        parts = parts + 1;
    }
    return address.address != ""
        && address.local_part != ""
        && address.domain != ""
        && parts == 2
        && contains(address.address, "@")
        && !has_unsafe_mailbox_text(address.address)
        && !contains(address.local_part, "@")
        && !contains(address.domain, "@")
        && local_part_has_valid_segments(address.local_part)
        && domain_has_valid_segments(address.domain);
}

flow local_part_has_valid_segments(value: string) -> bool ![] {
    if starts_with(value, ".") || ends_with_text(value, ".") || contains(value, "..") {
        return false;
    }
    if has_unsafe_mailbox_text(value) || contains(value, "/") || contains(value, "?") || contains(value, "#") {
        return false;
    }
    for part in split(value, ".") limit Iterations(128) {
        if part == "" {
            return false;
        }
    }
    return true;
}

flow is_safe_domain_label(label: string) -> bool ![] {
    return label != ""
        && !starts_with(label, "-")
        && !ends_with_text(label, "-")
        && !contains(label, "_");
}

flow domain_has_valid_segments(value: string) -> bool ![] {
    if !contains(value, ".") || starts_with(value, ".") || ends_with_text(value, ".") || contains(value, "..") {
        return false;
    }
    if has_unsafe_mailbox_text(value) || contains(value, "/") || contains(value, "?") || contains(value, "#") {
        return false;
    }
    for part in split(value, ".") limit Iterations(128) {
        if !is_safe_domain_label(part) {
            return false;
        }
    }
    return true;
}

flow raw_email_account_spec(id: string, provider: string, address: EmailAddress) -> EmailAccountSpec ![] {
    return EmailAccountSpec {
        id = trim(id),
        provider = trim(provider),
        address = address,
    };
}

flow raw_email_account_ref(account: EmailAccountSpec) -> EmailAccount ![] {
    return EmailAccount {
        id = account.id,
        provider = account.provider,
        address = account.address,
    };
}

public flow email_account_value(account: EmailAccount) -> EmailAccountSpec ![] {
    return EmailAccountSpec {
        id = account.id,
        provider = account.provider,
        address = account.address,
    };
}

public flow email_account(id: string, provider: string, address: EmailAddress) -> Result<EmailAccount, EmailError> ![] {
    let account = raw_email_account_spec(id, provider, address);
    if !is_valid_email_account_spec(account) {
        return Err(email_error("invalid_account", "invalid email account"));
    }
    return Ok(raw_email_account_ref(account));
}

flow is_safe_account_token(value: string) -> bool ![] {
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

public flow is_valid_email_account(account: EmailAccount) -> bool ![] {
    return is_valid_email_account_spec(email_account_value(account));
}

public flow is_valid_email_account_spec(account: EmailAccountSpec) -> bool ![] {
    return is_safe_account_token(account.id)
        && is_safe_account_token(account.provider)
        && is_valid_address(account.address);
}

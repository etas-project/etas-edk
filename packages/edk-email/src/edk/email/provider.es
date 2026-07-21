module edk.email.provider;

import std.text.{contains, split, starts_with, trim};
import edk.email.effects.EdkEmail;
import edk.email.errors.EmailError;
import edk.email.address.is_valid_email_account;
import edk.email.message.{is_valid_email_draft, is_valid_mailbox_query};
import edk.email.types.{DeliverableAddress, EmailAccount, EmailDraft, EmailMessage, EmailQuery, EmailReceipt, ProviderEndpoint, ProviderEndpointSpec};

flow email_error(code: string, message: string) -> EmailError ![] {
    return EmailError {
        code = code,
        message = message,
    };
}

flow raw_provider_endpoint_spec(name: string, api_host: string) -> ProviderEndpointSpec ![] {
    return ProviderEndpointSpec {
        name = trim(name),
        api_host = trim(api_host),
    };
}

flow raw_provider_endpoint_ref(endpoint: ProviderEndpointSpec) -> ProviderEndpoint ![] {
    return ProviderEndpoint {
        name = endpoint.name,
        api_host = endpoint.api_host,
    };
}

public flow provider_endpoint_value(endpoint: ProviderEndpoint) -> ProviderEndpointSpec ![] {
    return ProviderEndpointSpec {
        name = endpoint.name,
        api_host = endpoint.api_host,
    };
}

public flow provider_endpoint(name: string, api_host: string) -> Result<ProviderEndpoint, EmailError> ![] {
    let endpoint = raw_provider_endpoint_spec(name, api_host);
    if !is_valid_provider_endpoint_spec(endpoint) {
        return Err(email_error("invalid_provider_endpoint", "invalid provider endpoint"));
    }
    return Ok(raw_provider_endpoint_ref(endpoint));
}

flow is_safe_provider_token(value: string) -> bool ![] {
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

flow is_safe_host_label(label: string) -> bool ![] {
    return label != ""
        && !starts_with(label, "-")
        && !ends_with_text(label, "-")
        && !contains(label, "_");
}

flow is_safe_api_host(host: string) -> bool ![] {
    let normalized = trim(host);
    if normalized == "" || starts_with(normalized, ".") || ends_with_text(normalized, ".") {
        return false;
    }
    if contains(normalized, " ")
        || contains(normalized, "/")
        || contains(normalized, "\\")
        || contains(normalized, ":")
        || contains(normalized, "?")
        || contains(normalized, "#")
        || contains(normalized, "@")
        || contains(normalized, "..")
        || contains(normalized, "\t")
        || contains(normalized, "\n")
        || contains(normalized, "\r")
    {
        return false;
    }
    for label in split(normalized, ".") limit Iterations(128) {
        if !is_safe_host_label(label) {
            return false;
        }
    }
    return true;
}

public flow is_valid_provider_endpoint(endpoint: ProviderEndpoint) -> bool ![] {
    return is_valid_provider_endpoint_spec(provider_endpoint_value(endpoint));
}

public flow is_valid_provider_endpoint_spec(endpoint: ProviderEndpointSpec) -> bool ![] {
    return is_safe_provider_token(endpoint.name)
        && is_safe_api_host(endpoint.api_host);
}

flow raise_email_error(error: EmailError) -> never ![Error<EmailError>] {
    return perform Error<EmailError>.raise(error);
}

public flow send<A ~ DeliverableAddress>(account: EmailAccount, draft: EmailDraft<A>) -> EmailReceipt ![EdkEmail.send<A>, Error<EmailError>] {
    if !is_valid_email_account(account) {
        return raise_email_error(email_error("invalid_account", "invalid email account"));
    }
    if !is_valid_email_draft(draft) {
        return raise_email_error(email_error("invalid_draft", "invalid email draft"));
    }
    return perform EdkEmail.send(account, draft);
}

public flow read(account: EmailAccount, query: EmailQuery) -> Array<EmailMessage> ![EdkEmail.read, Error<EmailError>] {
    if !is_valid_email_account(account) {
        return raise_email_error(email_error("invalid_account", "invalid email account"));
    }
    if !is_valid_mailbox_query(query) {
        return raise_email_error(email_error("invalid_query", "invalid email query"));
    }
    return perform EdkEmail.read(account, query);
}

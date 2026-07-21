module edk.email.package_smoke;

import edk.email.address.{email_account, email_account_value, email_address, email_address_value, is_valid_email_account, parse_address};
import edk.email.errors.{AddressError, EmailError, SmtpError};
import edk.email.message.{draft, draft_to_one, is_valid_email_draft, is_valid_idempotency_key, is_valid_mailbox_query, mailbox_query, parse_header, with_bcc, with_cc, with_cursor, with_header, with_html_body, with_idempotency_key};
import edk.email.mocks.mailbox.{accepted_receipt, count_page_messages, email_message, filter_messages, mailbox_page};
import edk.email.provider.{is_valid_provider_endpoint, provider_endpoint, provider_endpoint_value};
import edk.email.pure.mime.{encode_text, html_part, text_part};
import edk.email.pure.rfc5322.{format_mailbox, has_required_headers, has_safe_headers, is_safe_display_name, is_safe_header_name, is_safe_header_value};
import edk.email.smtp.{default_submission_endpoint, is_valid_smtp_endpoint, smtp_endpoint, smtp_endpoint_value};
import edk.email.types.{EmailAccount, EmailAddress, ProviderEndpoint, TlsSmtpEndpoint, UserEmailHeader};

flow must_address(result: Result<EmailAddress, AddressError>) -> EmailAddress ![Error<AddressError>] {
    match result {
        Ok(address) => {
            return address;
        }
        Err(error) => {
            return perform Error<AddressError>.raise(error);
        }
    }
}

flow address_ok(result: Result<EmailAddress, AddressError>) -> bool ![] {
    match result {
        Ok(address) => {
            return true;
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_header(result: Result<UserEmailHeader, EmailError>) -> UserEmailHeader ![Error<EmailError>] {
    match result {
        Ok(item) => {
            return item;
        }
        Err(error) => {
            return perform Error<EmailError>.raise(error);
        }
    }
}

flow header_ok(result: Result<UserEmailHeader, EmailError>) -> bool ![] {
    match result {
        Ok(item) => {
            return true;
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_account(result: Result<EmailAccount, EmailError>) -> EmailAccount ![Error<EmailError>] {
    match result {
        Ok(account) => {
            return account;
        }
        Err(error) => {
            return perform Error<EmailError>.raise(error);
        }
    }
}

flow account_ok(result: Result<EmailAccount, EmailError>) -> bool ![] {
    match result {
        Ok(account) => {
            return is_valid_email_account(account);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_provider(result: Result<ProviderEndpoint, EmailError>) -> ProviderEndpoint ![Error<EmailError>] {
    match result {
        Ok(endpoint) => {
            return endpoint;
        }
        Err(error) => {
            return perform Error<EmailError>.raise(error);
        }
    }
}

flow provider_ok(result: Result<ProviderEndpoint, EmailError>) -> bool ![] {
    match result {
        Ok(endpoint) => {
            return is_valid_provider_endpoint(endpoint);
        }
        Err(error) => {
            return false;
        }
    }
}

flow must_smtp(result: Result<TlsSmtpEndpoint, SmtpError>) -> TlsSmtpEndpoint ![Error<SmtpError>] {
    match result {
        Ok(endpoint) => {
            return endpoint;
        }
        Err(error) => {
            return perform Error<SmtpError>.raise(error);
        }
    }
}

flow smtp_ok(result: Result<TlsSmtpEndpoint, SmtpError>) -> bool ![] {
    match result {
        Ok(endpoint) => {
            return is_valid_smtp_endpoint(endpoint);
        }
        Err(error) => {
            return false;
        }
    }
}

flow main(args: Array<string>) -> i32 ![Error<AddressError>, Error<EmailError>, Error<SmtpError>] {
    let parsed = parse_address("ops@example.com");
    let invalid = parse_address("not an address");
    let injected_address = parse_address("ops@example.com\nbcc@example.com");
    let tab_address = parse_address("ops@example.com\tbcc@example.com");
    let bare_domain = parse_address("ops@example");
    let empty_domain_label = parse_address("ops@.example.com");
    let double_domain_dot = parse_address("ops@example..com");
    let leading_hyphen_domain = parse_address("ops@-example.com");
    let trailing_hyphen_domain = parse_address("ops@example-.com");
    let underscore_domain = parse_address("ops@api_example.com");
    let empty_local_label = parse_address(".ops@example.com");
    let trailing_local_dot = parse_address("ops.@example.com");
    let unsafe_local_text = parse_address("ops<bad>@example.com");
    let parsed_address = must_address(parsed);
    let account = must_account(email_account("ops", "example", parsed_address));
    let account_value = email_account_value(account);
    let bad_account = email_account("ops/team", "example", parsed_address);
    let sender = must_address(email_address("Ops", "OPS@EXAMPLE.COM"));
    let base = with_header(draft_to_one(account_value.address, "Report", "ready"), must_header(parse_header("X-Trace", "abc")));
    let pure_draft = draft_to_one(account_value.address, "Report", "ready");
    let copied = must_address(parse_address("team@example.com"));
    let copied_draft = with_bcc(with_cc(pure_draft, [copied]), [sender]);
    let ready_draft = with_html_body(with_idempotency_key(base, "edk-email-smoke"), "<p>ready</p>");
    let bad_key_draft = with_idempotency_key(base, "bad key");
    let empty_recipients: Array<EmailAddress> = [];
    let empty_draft = draft(empty_recipients, "", "body");
    let bad_header_name = parse_header("Bad Header", "abc");
    let managed_header = parse_header("Subject", "spoofed");
    let unsafe_subject_draft = draft_to_one(account_value.address, "Report\nBcc: bad@example.com", "ready");
    let colon_key_draft = with_idempotency_key(base, "bad:key");
    let tab_key_draft = with_idempotency_key(base, "bad\tkey");
    let encoded = encode_text(ready_draft);
    let invalid_encoded = encode_text(empty_draft);
    let unsafe_subject_encoded = encode_text(unsafe_subject_draft);
    let text = text_part(ready_draft);
    let html = html_part(ready_draft);
    let query = with_cursor(mailbox_query("inbox", "Report", 1), "cursor-1");
    let bad_mailbox_query = mailbox_query("in/box", "Report", 1);
    let tab_mailbox_query = mailbox_query("in\tbox", "Report", 1);
    let over_limit_query = mailbox_query("inbox", "Report", 1001);
    let newline_query = mailbox_query("inbox", "Report\nBcc: bad@example.com", 1);
    let bad_cursor_query = with_cursor(mailbox_query("inbox", "Report", 1), "bad cursor");
    let page = mailbox_page([
        email_message(account, "m-1", sender, [account_value.address], "Report", "ready"),
        email_message(account, "m-2", sender, [account_value.address], "Other", "ignore"),
    ], "next");
    let filtered = filter_messages(query, page.messages);
    let bad_filtered = filter_messages(bad_mailbox_query, page.messages);
    let receipt = accepted_receipt(account, ready_draft, "provider-1");
    let smtp_result = default_submission_endpoint("smtp.example.com");
    let smtp = must_smtp(smtp_result);
    let bad_smtp = smtp_endpoint("smtp.example.com/path", 587, true);
    let leading_hyphen_smtp = smtp_endpoint("-smtp.example.com", 587, true);
    let trailing_dot_smtp = smtp_endpoint("smtp.example.com.", 587, true);
    let userinfo_smtp = smtp_endpoint("user@smtp.example.com", 587, true);
    let no_tls_smtp = smtp_endpoint("smtp.example.com", 587, false);
    let provider = must_provider(provider_endpoint("example", "api.example.com"));
    let bad_provider = provider_endpoint("ex ample", "api.example.com");
    let bad_provider_host = provider_endpoint("example", "api.example.com/path");
    let bad_provider_label = provider_endpoint("example", "api_.example.com");
    let bad_provider_dot = provider_endpoint("example", ".api.example.com");

    if address_ok(parsed)
        && !address_ok(invalid)
        && !address_ok(injected_address)
        && email_address_value(account_value.address).domain == "example.com"
        && is_valid_email_account(account)
        && !account_ok(bad_account)
        && email_address_value(sender).address == "ops@example.com"
        && pure_draft.subject == "Report"
        && has_required_headers(copied_draft)
        && !address_ok(tab_address)
        && !address_ok(bare_domain)
        && !address_ok(empty_domain_label)
        && !address_ok(double_domain_dot)
        && !address_ok(leading_hyphen_domain)
        && !address_ok(trailing_hyphen_domain)
        && !address_ok(underscore_domain)
        && !address_ok(empty_local_label)
        && !address_ok(trailing_local_dot)
        && !address_ok(unsafe_local_text)
        && has_required_headers(ready_draft)
        && !has_required_headers(empty_draft)
        && is_valid_email_draft(ready_draft)
        && !is_valid_email_draft(empty_draft)
        && !is_valid_email_draft(unsafe_subject_draft)
        && is_valid_idempotency_key(ready_draft.idempotency_key)
        && !is_valid_idempotency_key(bad_key_draft.idempotency_key)
        && !is_valid_idempotency_key(colon_key_draft.idempotency_key)
        && !is_valid_idempotency_key(tab_key_draft.idempotency_key)
        && !is_valid_email_draft(bad_key_draft)
        && !is_valid_email_draft(colon_key_draft)
        && !is_valid_email_draft(tab_key_draft)
        && has_safe_headers(ready_draft)
        && !header_ok(bad_header_name)
        && !header_ok(managed_header)
        && is_safe_header_value("safe")
        && !is_safe_header_value("bad\nvalue")
        && is_safe_header_name("X-Trace")
        && !is_safe_header_name("Bad Header")
        && !is_safe_header_name("X@Trace")
        && !is_safe_header_name("X\tTrace")
        && is_safe_display_name("Ops")
        && !is_safe_display_name("Ops\nBcc: bad@example.com")
        && !is_safe_display_name("<Ops>")
        && format_mailbox(sender) == "Ops ops@example.com"
        && encoded.ok
        && !invalid_encoded.ok
        && !unsafe_subject_encoded.ok
        && text.media_type == "text/plain"
        && html.media_type == "text/html"
        && query.cursor == "cursor-1"
        && is_valid_mailbox_query(query)
        && !is_valid_mailbox_query(bad_mailbox_query)
        && !is_valid_mailbox_query(tab_mailbox_query)
        && !is_valid_mailbox_query(over_limit_query)
        && !is_valid_mailbox_query(newline_query)
        && !is_valid_mailbox_query(bad_cursor_query)
        && !page.done
        && count_page_messages(filtered) == 1
        && count_page_messages(bad_filtered) == 0
        && receipt.accepted
        && receipt.idempotency_key == "edk-email-smoke"
        && smtp_endpoint_value(smtp).port == 587
        && smtp_endpoint_value(smtp).tls
        && smtp_ok(smtp_result)
        && !smtp_ok(bad_smtp)
        && !smtp_ok(leading_hyphen_smtp)
        && !smtp_ok(trailing_dot_smtp)
        && !smtp_ok(userinfo_smtp)
        && !smtp_ok(no_tls_smtp)
        && provider_endpoint_value(provider).api_host == "api.example.com"
        && is_valid_provider_endpoint(provider)
        && !provider_ok(bad_provider)
        && !provider_ok(bad_provider_host)
        && !provider_ok(bad_provider_label)
        && !provider_ok(bad_provider_dot)
    {
        return 0;
    }
    return 1;
}

module tests.edk.matrix.research_assistant.main;

import edk.docs.pure.html_sanitize.{report, sanitize};
import edk.docs.pure.doc_model.count_blocks;
import edk.email.address.{email_account, email_address};
import edk.email.effects.EdkEmail;
import edk.email.errors.{AddressError, EmailError};
import edk.email.message.{draft_to_one, with_idempotency_key};
import edk.email.provider.send as send_email;
import edk.email.pure.rfc5322.has_safe_headers;
import edk.email.types.{EmailAccount, EmailAddress};
import edk.http.url.https;
import edk.vector.effects.EdkVector;
import edk.vector.embed.embedding;
import edk.vector.errors.VectorError;
import edk.vector.store.{upsert, vector_record, vector_store};
import edk.vector.types.VectorRecord;
import edk.web.effects.EdkWeb;
import edk.web.errors.SearchError;
import edk.web.mocks.search_index.count_untrusted_results;
import edk.web.search.{is_valid_search_query, search, search_query, search_result, untrusted_result};

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

flow main(args: Array<string>) -> i32 ![EdkWeb.search, EdkVector.write, EdkEmail.send, Error<AddressError>, Error<SearchError>, Error<VectorError>, Error<EmailError>] {
    let query = search_query("etas edk", "test-provider", 3);
    let results = search(query);
    let raw_summary = "<p>untrusted web summary</p>";
    let raw_report = report(raw_summary);
    let safe_summary = "plain text research summary";
    let safe_report = report(safe_summary);
    let sanitized = sanitize(safe_summary);
    let fixture_results = [untrusted_result(search_result("etas edk", https("example.com", "/edk"), safe_summary, 1))];
    let fixture_result_count = count_untrusted_results(fixture_results);
    let observed_result_count = count_untrusted_results(results);

    let store = vector_store("research", "fixture");
    let records: Array<VectorRecord> = [vector_record("web-1", safe_summary, embedding([1, 2, 3]))];
    let write_receipt = upsert(store, records);

    let address = must_address(email_address("Ops", "ops@example.com"));
    let account = must_account(email_account("ops", "example", address));
    let draft = with_idempotency_key(draft_to_one(address, "Research digest", safe_summary), "research-assistant-digest");
    let receipt = send_email(account, draft);

    if !is_valid_search_query(query) { return 1; }
    if fixture_result_count != 1 { return 1; }
    if observed_result_count != observed_result_count { return 1; }
    if !raw_report.changed { return 1; }
    if safe_report.changed { return 1; }
    if count_blocks(sanitized.ast) != 0 { return 1; }
    if !has_safe_headers(draft) { return 1; }
    if draft.idempotency_key != "research-assistant-digest" { return 1; }
    if write_receipt.written != write_receipt.written { return 1; }
    if receipt.accepted != receipt.accepted { return 1; }
    return 0;
}

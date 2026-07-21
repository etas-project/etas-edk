module tests.edk.matrix.report_publisher.main;

import edk.email.address.{email_account, email_address};
import edk.email.effects.EdkEmail;
import edk.email.errors.{AddressError, EmailError};
import edk.email.message.{draft_to_one, with_idempotency_key};
import edk.email.provider.send as send_email;
import edk.email.pure.rfc5322.has_safe_headers;
import edk.email.types.{EmailAccount, EmailAddress};
import edk.http.url.https;
import edk.web.effects.EdkWeb;
import edk.web.errors.FetchError;
import edk.web.fetch.fetch;
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.{atomic_options, create_or_replace, read, write};
import edk.workspace.glob.scope_matches;
import edk.workspace.path.{is_path_escape, path_scope, workspace_path};
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

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

flow main(args: Array<string>) -> i32 ![EdkWeb.fetch, EdkWorkspace.read, EdkWorkspace.write, EdkEmail.send, Error<AddressError>, Error<FetchError>, Error<WorkspaceError>, Error<EmailError>] {
    let page = fetch(https("example.com", "/report"));
    let input = checked_workspace_path("reports/draft.md");
    let output = checked_workspace_path("reports/final.md");
    let reports_scope = path_scope("reports/");
    let body = read(input);
    write(output, body, atomic_options(create_or_replace()));

    let address = must_address(email_address("Editor", "editor@example.com"));
    let account = must_account(email_account("editor", "example", address));
    let draft = with_idempotency_key(draft_to_one(address, "Report ready", "workspace write and email send stay visible"), "report-publisher-send");
    let receipt = send_email(account, draft);

    if is_path_escape(input) { return 1; }
    if is_path_escape(output) { return 1; }
    if !scope_matches(reports_scope, input) { return 1; }
    if !scope_matches(reports_scope, output) { return 1; }
    if !has_safe_headers(draft) { return 1; }
    if draft.idempotency_key != "report-publisher-send" { return 1; }
    if receipt.accepted != receipt.accepted { return 1; }
    return 0;
}

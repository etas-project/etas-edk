module tests.edk.contract_boundaries.main;

import edk.db.pure.sql_check.classify_query;
import edk.db.sql.sql_query;
import edk.github.issue.{issue_draft, with_idempotency_key};
import edk.github.repo.{github_repo, github_repo_value};
import edk.http.pure.method.is_supported_method;
import edk.workspace.path.{is_path_escape, workspace_path};

flow check_db_readonly_boundary() -> i32 ![] {
    let select_plan = classify_query(sql_query("select * from users"));
    let delete_plan = classify_query(sql_query("delete from users"));
    let mixed_plan = classify_query(sql_query("select * from users; delete from users"));
    let transaction_plan = classify_query(sql_query("begin transaction"));
    let unknown_plan = classify_query(sql_query("noop"));

    if !select_plan.readonly { return 0; }
    if !delete_plan.mutation { return 0; }
    if delete_plan.readonly { return 0; }
    if !mixed_plan.mutation { return 0; }
    if mixed_plan.readonly { return 0; }
    if !transaction_plan.transaction { return 0; }
    if transaction_plan.readonly { return 0; }
    if unknown_plan.known { return 0; }
    return 1;
}

flow check_workspace_http_boundary() -> i32 ![] {
    if workspace_path("../secret.txt").ok { return 0; }
    if workspace_path("/tmp/secret.txt").ok { return 0; }
    if workspace_path("src\\secret.txt").ok { return 0; }
    if workspace_path("C:temp/secret.txt").ok { return 0; }
    if workspace_path("src\tsecret.txt").ok { return 0; }
    if !is_supported_method("GET") { return 0; }
    if !is_supported_method("patch") { return 0; }
    if is_supported_method("TRACE") { return 0; }
    return 1;
}

flow check_github_data_boundary() -> i32 ![] {
    let repo = match github_repo("etas-lang", "etas") {
        Ok(value) => value,
        Err(error) => {
            return 0;
        },
    };
    let draft = with_idempotency_key(issue_draft("Bug", "body"), "contract-boundary");

    let repo_value = github_repo_value(repo);
    if repo_value.owner != "etas-lang" { return 0; }
    if repo_value.name != "etas" { return 0; }
    if repo_value.api_host != "api.github.com" { return 0; }
    if draft.idempotency_key != "contract-boundary" { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![] {
    if check_db_readonly_boundary() + check_workspace_http_boundary() + check_github_data_boundary() == 3 {
        return 0;
    }
    return 1;
}

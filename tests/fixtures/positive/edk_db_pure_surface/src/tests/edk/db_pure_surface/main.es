module tests.edk.db_pure_surface.main;

import edk.db.mocks.in_memory.{empty_query_result, ok_exec, single_row_result};
import edk.db.pool.{default_pool_options, pool_options};
import edk.db.pure.row_decode.{cell, get_cell, has_cell, lookup_cell};
import edk.db.pure.sql_check.{classify_command, classify_query, is_readonly};
import edk.db.sql.{db_bool, db_i64, db_null, db_string, empty_row, is_valid_command_params, is_valid_param_name, is_valid_query_params, param, row_with_cell, sql_command, sql_command_with_params, sql_query, sql_query_with_params};
import edk.db.tools.query.explain_query;
import edk.db.transaction.{read_only_transaction, read_write_transaction, transaction_options};

flow check_sql_classification() -> i32 ![] {
    let select_plan = classify_query(sql_query("select * from users"));
    let multiline_select_plan = classify_query(sql_query("select\n*\nfrom users"));
    let semicolon_select_plan = classify_query(sql_query("select;"));
    let explained_plan = explain_query(sql_query("select * from users"));
    let explain_plan = classify_query(sql_query("EXPLAIN SELECT 1"));
    let mixed_plan = classify_query(sql_query("select * from users; delete from users"));
    let compact_mixed_plan = classify_query(sql_query("select 1;delete;"));
    let readonly_identifier_plan = classify_query(sql_query("select deleted_at from audit_log"));
    let comment_select_plan = classify_query(sql_query("select/*columns*/1"));
    let prefixed_comment_select_plan = classify_query(sql_query("/*leading*/select 1"));
    let mutation_plan = classify_command(sql_command("DELETE FROM users"));
    let semicolon_delete_plan = classify_command(sql_command("DELETE;"));
    let tab_mutation_plan = classify_command(sql_command("DELETE\tFROM users"));
    let comment_delete_plan = classify_command(sql_command("DELETE/*batch*/FROM users"));
    let prefixed_comment_delete_plan = classify_command(sql_command("/*leading*/DELETE FROM users"));
    let merge_plan = classify_command(sql_command("MERGE INTO users USING staging ON users.id = staging.id"));
    let replace_plan = classify_command(sql_command("REPLACE INTO settings VALUES ('theme', 'dark')"));
    let grant_plan = classify_command(sql_command("GRANT SELECT ON users TO analyst"));
    let copy_plan = classify_command(sql_command("COPY users TO '/tmp/users.csv'"));
    let call_plan = classify_command(sql_command("CALL refresh_materialized_views()"));
    let exec_plan = classify_command(sql_command("EXEC(refresh_materialized_views)"));
    let vacuum_plan = classify_command(sql_command("VACUUM"));
    let analyze_plan = classify_command(sql_command("ANALYZE users"));
    let pragma_plan = classify_command(sql_command("PRAGMA journal_mode = WAL"));
    let set_plan = classify_command(sql_command("SET ROLE admin"));
    let use_plan = classify_command(sql_command("USE analytics"));
    let lock_plan = classify_command(sql_command("LOCK TABLE users"));
    let refresh_plan = classify_command(sql_command("REFRESH MATERIALIZED VIEW mv_users"));
    let tx_plan = classify_command(sql_command("BEGIN"));
    let semicolon_tx_plan = classify_command(sql_command("COMMIT;"));
    let cr_tx_plan = classify_command(sql_command("BEGIN\rTRANSACTION"));
    let comment_tx_plan = classify_command(sql_command("BEGIN/*tx*/TRANSACTION"));
    let prefixed_comment_tx_plan = classify_command(sql_command("/*leading*/BEGIN TRANSACTION"));
    let savepoint_plan = classify_command(sql_command("SAVEPOINT before_batch"));
    let unknown_plan = classify_query(sql_query("noop"));

    if !select_plan.readonly { return 0; }
    if !multiline_select_plan.readonly { return 0; }
    if !semicolon_select_plan.readonly { return 0; }
    if explained_plan.kind != "readonly" { return 0; }
    if !explain_plan.readonly { return 0; }
    if !mixed_plan.mutation { return 0; }
    if mixed_plan.readonly { return 0; }
    if !compact_mixed_plan.mutation { return 0; }
    if !readonly_identifier_plan.readonly { return 0; }
    if readonly_identifier_plan.mutation { return 0; }
    if !comment_select_plan.readonly { return 0; }
    if !prefixed_comment_select_plan.readonly { return 0; }
    if !mutation_plan.mutation { return 0; }
    if !semicolon_delete_plan.mutation { return 0; }
    if !tab_mutation_plan.mutation { return 0; }
    if !comment_delete_plan.mutation { return 0; }
    if !prefixed_comment_delete_plan.mutation { return 0; }
    if !merge_plan.mutation { return 0; }
    if !replace_plan.mutation { return 0; }
    if !grant_plan.mutation { return 0; }
    if !copy_plan.mutation { return 0; }
    if !call_plan.mutation { return 0; }
    if !exec_plan.mutation { return 0; }
    if !vacuum_plan.mutation { return 0; }
    if !analyze_plan.mutation { return 0; }
    if !pragma_plan.mutation { return 0; }
    if !set_plan.mutation { return 0; }
    if !use_plan.mutation { return 0; }
    if !lock_plan.mutation { return 0; }
    if !refresh_plan.mutation { return 0; }
    if !tx_plan.transaction { return 0; }
    if !semicolon_tx_plan.transaction { return 0; }
    if !cr_tx_plan.transaction { return 0; }
    if !comment_tx_plan.transaction { return 0; }
    if !prefixed_comment_tx_plan.transaction { return 0; }
    if !savepoint_plan.transaction { return 0; }
    if unknown_plan.known { return 0; }
    if !is_readonly(sql_query("show tables")) { return 0; }
    return 1;
}

flow check_placeholders() -> i32 ![] {
    let id_param = param("id", db_i64(7));
    let active_param = param("active", db_bool(true));
    let valid_query = sql_query_with_params("select * from users where id = :id and active = @active", [id_param, active_param]);
    let missing_query = sql_query_with_params("select * from users where id = :id", [active_param]);
    let bad_name_query = sql_query_with_params("select * from users where id = :bad_name", [param("bad name", db_i64(1))]);
    let valid_command = sql_command_with_params("update users set active = @active where id = :id", [active_param, id_param]);
    let missing_command = sql_command_with_params("update users set active = true", [active_param]);
    let bad_name_command = sql_command_with_params("update users set active = :active", [param("active;drop", db_bool(false))]);

    if !is_valid_param_name("id") { return 0; }
    if is_valid_param_name("bad name") { return 0; }
    if is_valid_param_name("bad;name") { return 0; }
    if is_valid_param_name(":id") { return 0; }
    if !is_valid_query_params(valid_query) { return 0; }
    if is_valid_query_params(missing_query) { return 0; }
    if is_valid_query_params(bad_name_query) { return 0; }
    if !is_valid_command_params(valid_command) { return 0; }
    if is_valid_command_params(missing_command) { return 0; }
    if is_valid_command_params(bad_name_command) { return 0; }
    return 1;
}

flow check_rows_and_results() -> i32 ![Error<IndexError>] {
    let row = row_with_cell(
        row_with_cell(
            row_with_cell(
                row_with_cell(empty_row(), cell("name", db_string("alice"))),
                cell("id", db_i64(7)),
            ),
            cell("active", db_bool(true)),
        ),
        cell("note", db_null()),
    );
    let name = lookup_cell(row, "name");
    let missing = lookup_cell(row, "missing");
    let strict_id = get_cell(row, "id");
    let result = single_row_result(row);
    let empty = empty_query_result();
    let exec_result = ok_exec("ok");

    if !has_cell(row, "active") { return 0; }
    if !name.found { return 0; }
    if name.cell.value.text != "alice" { return 0; }
    if missing.found { return 0; }
    if strict_id.value.integer != 7 { return 0; }
    if result.row_count != 1 { return 0; }
    if empty.row_count != 0 { return 0; }
    if exec_result.message != "ok" { return 0; }
    return 1;
}

flow check_options() -> i32 ![] {
    let default_pool = default_pool_options();
    let tuned_pool = pool_options(4, 5000);
    let read_only = read_only_transaction();
    let read_write = read_write_transaction();
    let serializable = transaction_options(true, "serializable");

    if default_pool.max_connections != 8 { return 0; }
    if tuned_pool.connect_timeout_millis != 5000 { return 0; }
    if !read_only.read_only { return 0; }
    if read_write.read_only { return 0; }
    if serializable.isolation != "serializable" { return 0; }
    return 1;
}

flow main(args: Array<string>) -> i32 ![Error<IndexError>] {
    if check_sql_classification() + check_placeholders() + check_rows_and_results() + check_options() == 4 {
        return 0;
    }
    return 1;
}

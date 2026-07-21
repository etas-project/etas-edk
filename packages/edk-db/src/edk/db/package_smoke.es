module edk.db.package_smoke;

import edk.db.mocks.in_memory.{empty_query_result, ok_exec, single_row_result};
import edk.db.pool.{default_pool_options, pool_options};
import edk.db.pure.row_decode.{cell, get_cell, has_cell, lookup_cell};
import edk.db.pure.sql_check.{classify_command, classify_query, is_readonly};
import edk.db.sql.{db_bool, db_i64, db_null, db_string, empty_row, is_valid_command_params, is_valid_param_name, is_valid_query_params, param, row_with_cell, sql_command, sql_command_with_params, sql_query, sql_query_with_params};
import edk.db.transaction.{read_only_transaction, read_write_transaction, transaction_options};

flow main(args: Array<string>) -> i32 ![Error<IndexError>] {
    let pool = default_pool_options();
    let tuned_pool = pool_options(4, 5000);
    let select_plan = classify_query(sql_query("SELECT 1"));
    let multiline_select_plan = classify_query(sql_query("SELECT\n*\nFROM users"));
    let semicolon_select_plan = classify_query(sql_query("SELECT;"));
    let with_plan = classify_query(sql_query("WITH q AS (SELECT 1) SELECT * FROM q"));
    let mixed_plan = classify_query(sql_query("SELECT * FROM users; DELETE FROM users"));
    let compact_mixed_plan = classify_query(sql_query("SELECT 1;DELETE;"));
    let readonly_identifier_plan = classify_query(sql_query("SELECT deleted_at FROM audit_log"));
    let comment_select_plan = classify_query(sql_query("SELECT/*columns*/1"));
    let prefixed_comment_select_plan = classify_query(sql_query("/*leading*/SELECT 1"));
    let insert_plan = classify_command(sql_command("INSERT INTO t VALUES (1)"));
    let semicolon_delete_plan = classify_command(sql_command("DELETE;"));
    let tab_delete_plan = classify_command(sql_command("DELETE\tFROM users"));
    let comment_delete_plan = classify_command(sql_command("DELETE/*batch*/FROM users"));
    let prefixed_comment_delete_plan = classify_command(sql_command("/*leading*/DELETE FROM users"));
    let merge_plan = classify_command(sql_command("MERGE INTO users USING staging ON users.id = staging.id"));
    let grant_plan = classify_command(sql_command("GRANT SELECT ON users TO analyst"));
    let call_plan = classify_command(sql_command("CALL refresh_materialized_views()"));
    let exec_plan = classify_command(sql_command("EXEC(refresh_materialized_views)"));
    let vacuum_plan = classify_command(sql_command("VACUUM"));
    let analyze_plan = classify_command(sql_command("ANALYZE users"));
    let pragma_plan = classify_command(sql_command("PRAGMA journal_mode = WAL"));
    let set_plan = classify_command(sql_command("SET ROLE admin"));
    let use_plan = classify_command(sql_command("USE analytics"));
    let lock_plan = classify_command(sql_command("LOCK TABLE users"));
    let refresh_plan = classify_command(sql_command("REFRESH MATERIALIZED VIEW mv_users"));
    let tx_plan = classify_command(sql_command("ROLLBACK"));
    let semicolon_tx_plan = classify_command(sql_command("COMMIT;"));
    let cr_tx_plan = classify_command(sql_command("BEGIN\rTRANSACTION"));
    let comment_tx_plan = classify_command(sql_command("BEGIN/*tx*/TRANSACTION"));
    let prefixed_comment_tx_plan = classify_command(sql_command("/*leading*/BEGIN TRANSACTION"));
    let savepoint_plan = classify_command(sql_command("SAVEPOINT before_batch"));
    let unknown_plan = classify_query(sql_query("noop"));
    let id_param = param("id", db_i64(7));
    let active_param = param("active", db_bool(true));
    let valid_param_query = sql_query_with_params("SELECT * FROM users WHERE id = :id AND active = @active", [id_param, active_param]);
    let missing_param_query = sql_query_with_params("SELECT * FROM users WHERE id = :id", [active_param]);
    let bad_param_query = sql_query_with_params("SELECT * FROM users WHERE id = :bad_name", [param("bad name", db_i64(1))]);
    let valid_param_command = sql_command_with_params("UPDATE users SET active = @active WHERE id = :id", [active_param, id_param]);
    let missing_param_command = sql_command_with_params("UPDATE users SET active = true", [active_param]);
    let bad_param_command = sql_command_with_params("UPDATE users SET active = :active", [param("active;drop", db_bool(false))]);
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
    let read_only = read_only_transaction();
    let read_write = read_write_transaction();
    let serializable = transaction_options(true, "serializable");

    if pool.max_connections != 8 { return 1; }
    if tuned_pool.connect_timeout_millis != 5000 { return 1; }
    if !select_plan.readonly { return 1; }
    if !multiline_select_plan.readonly { return 1; }
    if !semicolon_select_plan.readonly { return 1; }
    if !with_plan.readonly { return 1; }
    if !mixed_plan.mutation { return 1; }
    if mixed_plan.readonly { return 1; }
    if !compact_mixed_plan.mutation { return 1; }
    if !readonly_identifier_plan.readonly { return 1; }
    if readonly_identifier_plan.mutation { return 1; }
    if !comment_select_plan.readonly { return 1; }
    if !prefixed_comment_select_plan.readonly { return 1; }
    if !insert_plan.mutation { return 1; }
    if !semicolon_delete_plan.mutation { return 1; }
    if !tab_delete_plan.mutation { return 1; }
    if !comment_delete_plan.mutation { return 1; }
    if !prefixed_comment_delete_plan.mutation { return 1; }
    if !merge_plan.mutation { return 1; }
    if !grant_plan.mutation { return 1; }
    if !call_plan.mutation { return 1; }
    if !exec_plan.mutation { return 1; }
    if !vacuum_plan.mutation { return 1; }
    if !analyze_plan.mutation { return 1; }
    if !pragma_plan.mutation { return 1; }
    if !set_plan.mutation { return 1; }
    if !use_plan.mutation { return 1; }
    if !lock_plan.mutation { return 1; }
    if !refresh_plan.mutation { return 1; }
    if !tx_plan.transaction { return 1; }
    if !semicolon_tx_plan.transaction { return 1; }
    if !cr_tx_plan.transaction { return 1; }
    if !comment_tx_plan.transaction { return 1; }
    if !prefixed_comment_tx_plan.transaction { return 1; }
    if !savepoint_plan.transaction { return 1; }
    if unknown_plan.known { return 1; }
    if !is_readonly(sql_query("show tables")) { return 1; }
    if !is_valid_param_name("id") { return 1; }
    if is_valid_param_name("bad name") { return 1; }
    if is_valid_param_name("bad;name") { return 1; }
    if !is_valid_query_params(valid_param_query) { return 1; }
    if is_valid_query_params(missing_param_query) { return 1; }
    if is_valid_query_params(bad_param_query) { return 1; }
    if !is_valid_command_params(valid_param_command) { return 1; }
    if is_valid_command_params(missing_param_command) { return 1; }
    if is_valid_command_params(bad_param_command) { return 1; }
    if !has_cell(row, "active") { return 1; }
    if !name.found { return 1; }
    if name.cell.value.text != "alice" { return 1; }
    if missing.found { return 1; }
    if strict_id.value.integer != 7 { return 1; }
    if result.row_count != 1 { return 1; }
    if empty.row_count != 0 { return 1; }
    if exec_result.message != "ok" { return 1; }
    if !read_only.read_only { return 1; }
    if read_write.read_only { return 1; }
    if serializable.isolation != "serializable" { return 1; }
    return 0;
}

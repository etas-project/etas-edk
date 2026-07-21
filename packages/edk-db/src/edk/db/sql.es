module edk.db.sql;

import std.text.{contains, join, trim};
import edk.db.effects.EdkDb;
import edk.db.errors.DbError;
import edk.db.types.{DatasourceRef, DbValue, ExecResult, QueryResult, Row, SqlCommand, SqlParam, SqlQuery};

public flow datasource(name: string, driver: string, endpoint: string) -> DatasourceRef ![] {
    return DatasourceRef {
        name = trim(name),
        driver = trim(driver),
        endpoint = trim(endpoint),
    };
}

public flow db_string(value: string) -> DbValue ![] {
    return DbValue { kind = "string", text = value, integer = 0, truth = false };
}

public flow db_i64(value: i64) -> DbValue ![] {
    return DbValue { kind = "i64", text = "", integer = value, truth = false };
}

public flow db_bool(value: bool) -> DbValue ![] {
    return DbValue { kind = "bool", text = "", integer = 0, truth = value };
}

public flow db_null() -> DbValue ![] {
    return DbValue { kind = "null", text = "", integer = 0, truth = false };
}

public flow param(name: string, value: DbValue) -> SqlParam ![] {
    return SqlParam { name = trim(name), value = value };
}

public flow is_valid_param_name(name: string) -> bool ![] {
    let normalized = trim(name);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r")
        && !contains(normalized, ":")
        && !contains(normalized, "@")
        && !contains(normalized, "?")
        && !contains(normalized, ";")
        && !contains(normalized, ",")
        && !contains(normalized, ".")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, "'")
        && !contains(normalized, "\"")
        && !contains(normalized, "(")
        && !contains(normalized, ")");
}

flow has_named_placeholder(sql: string, name: string) -> bool ![] {
    let normalized = trim(name);
    return contains(sql, join([":", normalized], ""))
        || contains(sql, join(["@", normalized], ""));
}

public flow is_valid_query_params(query: SqlQuery) -> bool ![] {
    for parameter in query.params limit Iterations(1024) {
        if !is_valid_param_name(parameter.name) {
            return false;
        }
        if !has_named_placeholder(query.text, parameter.name) {
            return false;
        }
    }
    return true;
}

public flow is_valid_command_params(command: SqlCommand) -> bool ![] {
    for parameter in command.params limit Iterations(1024) {
        if !is_valid_param_name(parameter.name) {
            return false;
        }
        if !has_named_placeholder(command.text, parameter.name) {
            return false;
        }
    }
    return true;
}

public flow empty_params() -> Array<SqlParam> ![] {
    let params: Array<SqlParam> = [];
    return params;
}

public flow sql_query(text: string) -> SqlQuery ![] {
    return SqlQuery { text = trim(text), params = empty_params() };
}

public flow sql_query_with_params(text: string, params: Array<SqlParam>) -> SqlQuery ![] {
    return SqlQuery { text = trim(text), params = params };
}

public flow sql_command(text: string) -> SqlCommand ![] {
    return SqlCommand { text = trim(text), params = empty_params() };
}

public flow sql_command_with_params(text: string, params: Array<SqlParam>) -> SqlCommand ![] {
    return SqlCommand { text = trim(text), params = params };
}

public flow empty_row() -> Row ![] {
    let cells: Array<SqlParam> = [];
    return Row { cells = cells };
}

public flow row_with_cell(row: Row, cell: SqlParam) -> Row ![] {
    return Row { cells = row.cells.push(cell) };
}

public flow query(datasource: DatasourceRef, query: SqlQuery) -> QueryResult ![EdkDb.query, Error<DbError>] {
    return perform EdkDb.query(datasource, query);
}

public flow exec(datasource: DatasourceRef, command: SqlCommand) -> ExecResult ![EdkDb.exec, Error<DbError>] {
    return perform EdkDb.exec(datasource, command);
}

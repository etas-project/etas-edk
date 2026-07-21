module edk.db.mocks.in_memory;

import edk.db.sql.empty_row;
import edk.db.types.{ExecResult, QueryResult, Row};

public flow empty_query_result() -> QueryResult ![] {
    let rows: Array<Row> = [];
    return QueryResult {
        rows = rows,
        row_count = 0,
    };
}

public flow single_row_result(row: Row) -> QueryResult ![] {
    let rows: Array<Row> = [row];
    return QueryResult {
        rows = rows,
        row_count = 1,
    };
}

public flow ok_exec(message: string) -> ExecResult ![] {
    return ExecResult {
        affected_rows = 0,
        message = message,
    };
}

public flow empty_fixture_row() -> Row ![] {
    return empty_row();
}

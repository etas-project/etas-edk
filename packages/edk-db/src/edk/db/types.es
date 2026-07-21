module edk.db.types;

public type DatasourceRef = {
    name: string,
    driver: string,
    endpoint: string,
};

public alias DbValue = {
    kind: string,
    text: string,
    integer: i64,
    truth: bool,
};

public alias SqlParam = {
    name: string,
    value: DbValue,
};

public alias SqlQuery = {
    text: string,
    params: Array<SqlParam>,
};

public alias SqlCommand = {
    text: string,
    params: Array<SqlParam>,
};

public alias Row = {
    cells: Array<SqlParam>,
};

public alias CellLookup = {
    found: bool,
    cell: SqlParam,
};

public alias QueryResult = {
    rows: Array<Row>,
    row_count: i32,
};

public alias ExecResult = {
    affected_rows: i64,
    message: string,
};

public alias TransactionOptions = {
    read_only: bool,
    isolation: string,
};

public alias PoolOptions = {
    max_connections: i32,
    connect_timeout_millis: i32,
};

public alias SqlClassification = {
    kind: string,
    readonly: bool,
    mutation: bool,
    transaction: bool,
    known: bool,
};

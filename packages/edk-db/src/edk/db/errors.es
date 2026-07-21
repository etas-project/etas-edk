module edk.db.errors;

import edk.db.types.DatasourceRef;

public type DbError = {
    kind: string,
    datasource: DatasourceRef,
    message: string,
};

public type SqlSyntaxError = {
    sql: string,
    message: string,
};

public type ConnectionError = {
    datasource: DatasourceRef,
    message: string,
};

public type TransactionError = {
    datasource: DatasourceRef,
    message: string,
};

public type ConstraintError = {
    name: string,
    message: string,
};

public type DecodeError = {
    column: string,
    message: string,
};

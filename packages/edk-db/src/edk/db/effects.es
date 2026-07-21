module edk.db.effects;

import edk.db.types.{DatasourceRef, ExecResult, QueryResult, SqlCommand, SqlQuery};

public effect EdkDb extends Network {
    action query(datasource: DatasourceRef, query: SqlQuery) -> QueryResult;
    action exec(datasource: DatasourceRef, command: SqlCommand) -> ExecResult;
}

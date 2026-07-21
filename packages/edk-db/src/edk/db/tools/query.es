module edk.db.tools.query;

import edk.db.pure.sql_check.classify_query;
import edk.db.types.{SqlClassification, SqlQuery};

public tool explain_query(query_text: SqlQuery) -> SqlClassification ![] {
    return classify_query(query_text);
}

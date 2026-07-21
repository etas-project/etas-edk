module edk.db.pure.sql_check;

import std.text.{contains, join, lowercase, split, starts_with, trim};
import edk.db.types.{SqlClassification, SqlCommand, SqlQuery};

flow replace_separator(value: string, separator: string) -> string ![] {
    return join(split(value, separator), " ");
}

flow normalize_sql_whitespace(sql: string) -> string ![] {
    let lowered = lowercase(trim(sql));
    let without_cr = replace_separator(lowered, "\r");
    let without_lf = replace_separator(without_cr, "\n");
    return trim(replace_separator(without_lf, "\t"));
}

flow keyword_followed_by(value: string, keyword: string, suffix: string) -> bool ![] {
    let token = join([keyword, suffix], "");
    return starts_with(value, token)
        || contains(value, join([" ", token], ""))
        || contains(value, join([";", token], ""))
        || contains(value, join(["(", token], ""))
        || contains(value, join([",", token], ""));
}

flow has_keyword(value: string, keyword: string) -> bool ![] {
    return value == keyword
        || starts_with(value, join([keyword, ""], " "))
        || starts_with(value, join([keyword, ""], ";"))
        || keyword_followed_by(value, keyword, "(")
        || keyword_followed_by(value, keyword, "/")
        || keyword_followed_by(value, keyword, "-")
        || contains(value, join(["", keyword, ""], " "))
        || contains(value, join(["/", keyword], ""))
        || contains(value, join(["-", keyword], ""))
        || contains(value, join([join(["", keyword], " "), ""], ";"))
        || contains(value, join(["", keyword], ";"))
        || contains(value, join(["", keyword], "; "));
}

flow has_insert(value: string) -> bool ![] {
    return has_keyword(value, "insert");
}

flow has_update(value: string) -> bool ![] {
    return has_keyword(value, "update");
}

flow has_delete(value: string) -> bool ![] {
    return has_keyword(value, "delete");
}

flow has_create(value: string) -> bool ![] {
    return has_keyword(value, "create");
}

flow has_drop(value: string) -> bool ![] {
    return has_keyword(value, "drop");
}

flow has_alter(value: string) -> bool ![] {
    return has_keyword(value, "alter");
}

flow has_truncate(value: string) -> bool ![] {
    return has_keyword(value, "truncate");
}

flow has_merge(value: string) -> bool ![] {
    return has_keyword(value, "merge");
}

flow has_replace(value: string) -> bool ![] {
    return has_keyword(value, "replace");
}

flow has_grant(value: string) -> bool ![] {
    return has_keyword(value, "grant");
}

flow has_revoke(value: string) -> bool ![] {
    return has_keyword(value, "revoke");
}

flow has_call(value: string) -> bool ![] {
    return has_keyword(value, "call");
}

flow has_execute(value: string) -> bool ![] {
    return has_keyword(value, "execute") || has_keyword(value, "exec");
}

flow has_copy(value: string) -> bool ![] {
    return has_keyword(value, "copy");
}

flow has_load(value: string) -> bool ![] {
    return has_keyword(value, "load");
}

flow has_vacuum(value: string) -> bool ![] {
    return has_keyword(value, "vacuum");
}

flow has_analyze(value: string) -> bool ![] {
    return has_keyword(value, "analyze");
}

flow has_pragma(value: string) -> bool ![] {
    return has_keyword(value, "pragma");
}

flow has_set(value: string) -> bool ![] {
    return has_keyword(value, "set");
}

flow has_use(value: string) -> bool ![] {
    return has_keyword(value, "use");
}

flow has_lock(value: string) -> bool ![] {
    return has_keyword(value, "lock") || has_keyword(value, "unlock");
}

flow has_refresh(value: string) -> bool ![] {
    return has_keyword(value, "refresh");
}

flow has_attach(value: string) -> bool ![] {
    return has_keyword(value, "attach");
}

flow has_detach(value: string) -> bool ![] {
    return has_keyword(value, "detach");
}

flow has_begin(value: string) -> bool ![] {
    return has_keyword(value, "begin");
}

flow has_commit(value: string) -> bool ![] {
    return has_keyword(value, "commit");
}

flow has_rollback(value: string) -> bool ![] {
    return has_keyword(value, "rollback");
}

flow has_savepoint(value: string) -> bool ![] {
    return has_keyword(value, "savepoint");
}

flow has_release(value: string) -> bool ![] {
    return has_keyword(value, "release");
}

flow has_readonly_keyword(value: string) -> bool ![] {
    return has_keyword(value, "select")
        || has_keyword(value, "with")
        || has_keyword(value, "show")
        || has_keyword(value, "describe")
        || has_keyword(value, "explain");
}

flow has_mutation_keyword(value: string) -> bool ![] {
    return has_insert(value)
        || has_update(value)
        || has_delete(value)
        || has_create(value)
        || has_drop(value)
        || has_alter(value)
        || has_truncate(value)
        || has_merge(value)
        || has_replace(value)
        || has_grant(value)
        || has_revoke(value)
        || has_call(value)
        || has_execute(value)
        || has_copy(value)
        || has_load(value)
        || has_vacuum(value)
        || has_analyze(value)
        || has_pragma(value)
        || has_set(value)
        || has_use(value)
        || has_lock(value)
        || has_refresh(value)
        || has_attach(value)
        || has_detach(value);
}

flow has_transaction_keyword(value: string) -> bool ![] {
    return has_begin(value) || has_commit(value) || has_rollback(value) || has_savepoint(value) || has_release(value);
}

flow classify_text(sql: string) -> SqlClassification ![] {
    let value = normalize_sql_whitespace(sql);

    if has_transaction_keyword(value) {
        return SqlClassification {
            kind = "transaction",
            readonly = false,
            mutation = false,
            transaction = true,
            known = true,
        };
    }

    if has_mutation_keyword(value) {
        return SqlClassification {
            kind = "mutation",
            readonly = false,
            mutation = true,
            transaction = false,
            known = true,
        };
    }

    if has_readonly_keyword(value) {
        return SqlClassification {
            kind = "readonly",
            readonly = true,
            mutation = false,
            transaction = false,
            known = true,
        };
    }

    return SqlClassification {
        kind = "unknown",
        readonly = false,
        mutation = false,
        transaction = false,
        known = false,
    };
}

public flow classify_query(query: SqlQuery) -> SqlClassification ![] {
    return classify_text(query.text);
}

public flow classify_command(command: SqlCommand) -> SqlClassification ![] {
    return classify_text(command.text);
}

public flow is_readonly(query: SqlQuery) -> bool ![] {
    return classify_query(query).readonly;
}

module edk.web.search;

import std.text.{contains, trim};
import std.security.trust.Untrusted;
import edk.http.types.Url;
import edk.web.effects.EdkWeb;
import edk.web.errors.SearchError;
import edk.web.types.{SearchQuery, SearchResult, WebSnippet};

public flow search_query(text: string, provider: string, limit: i32) -> SearchQuery ![] {
    return SearchQuery {
        text = trim(text),
        provider = trim(provider),
        limit = limit,
        language = "",
    };
}

public flow with_language(query: SearchQuery, language: string) -> SearchQuery ![] {
    return SearchQuery {
        text = query.text,
        provider = query.provider,
        limit = query.limit,
        language = trim(language),
    };
}

flow is_safe_query_text(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

flow is_safe_query_token(value: string) -> bool ![] {
    let normalized = trim(value);
    return normalized != ""
        && !contains(normalized, " ")
        && !contains(normalized, "/")
        && !contains(normalized, "\\")
        && !contains(normalized, ":")
        && !contains(normalized, "?")
        && !contains(normalized, "#")
        && !contains(normalized, "@")
        && !contains(normalized, "\t")
        && !contains(normalized, "\n")
        && !contains(normalized, "\r");
}

flow is_safe_optional_language(value: string) -> bool ![] {
    let normalized = trim(value);
    if normalized == "" {
        return true;
    }
    return is_safe_query_token(normalized);
}

public flow is_valid_search_query(query: SearchQuery) -> bool ![] {
    return is_safe_query_text(query.text)
        && is_safe_query_token(query.provider)
        && is_safe_optional_language(query.language)
        && query.limit > 0
        && query.limit <= 100;
}

public flow snippet(text: string, source: string) -> WebSnippet ![] {
    return WebSnippet {
        text = text,
        source = trim(source),
    };
}

public flow search_result(title: string, url: Url, text: string, rank: i32) -> SearchResult ![] {
    return SearchResult {
        title = trim(title),
        url = url,
        snippet = snippet(text, "search"),
        rank = rank,
    };
}

public flow untrusted_result(result: SearchResult) -> Untrusted<SearchResult> ![] {
    return Untrusted(result);
}

public flow search(query: SearchQuery) -> Array<Untrusted<SearchResult>> ![EdkWeb.search, Error<SearchError>] {
    return perform EdkWeb.search(query);
}

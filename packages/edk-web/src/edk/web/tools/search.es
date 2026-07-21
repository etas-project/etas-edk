module edk.web.tools.search;

import edk.web.effects.EdkWeb;
import edk.web.errors.SearchError;
import edk.web.search.search;
import edk.web.types.{SearchQuery, SearchResult};

public tool search_web(query: SearchQuery) -> Array<Untrusted<SearchResult>> ![EdkWeb.search, Error<SearchError>] {
    return search(query);
}

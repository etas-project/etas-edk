module edk.web.effects;

import edk.http.types.Url;
import edk.web.types.{CrawlPolicy, CrawlResult, SearchQuery, SearchResult, WebPage};

public effect EdkWeb extends Network {
    action search(query: SearchQuery) -> Array<Untrusted<SearchResult>>;
    action fetch(url: Url) -> Untrusted<WebPage>;
    action crawl(start: Url, policy: CrawlPolicy) -> CrawlResult;
}

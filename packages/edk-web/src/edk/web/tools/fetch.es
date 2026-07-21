module edk.web.tools.fetch;

import edk.http.types.Url;
import edk.web.crawl.{crawl, crawl_policy};
import edk.web.effects.EdkWeb;
import edk.web.errors.{FetchError, WebError};
import edk.web.fetch.fetch;
import edk.web.types.{CrawlResult, WebPage};

public tool fetch_page(url: Url) -> Untrusted<WebPage> ![EdkWeb.fetch, Error<FetchError>] {
    return fetch(url);
}

public tool crawl_site(start: Url, limit: i32) -> CrawlResult ![EdkWeb.crawl, Error<WebError>] {
    return crawl(start, crawl_policy(limit, true));
}

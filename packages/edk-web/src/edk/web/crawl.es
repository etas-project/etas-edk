module edk.web.crawl;

import edk.http.types.Url;
import edk.web.effects.EdkWeb;
import edk.web.errors.WebError;
import edk.web.types.{CrawlPolicy, CrawlResult, WebPage};

public flow crawl_policy(max_pages: i32, same_domain: bool) -> CrawlPolicy ![] {
    return CrawlPolicy {
        max_pages = max_pages,
        same_domain = same_domain,
        obey_robots = true,
        max_bytes = 1048576,
    };
}

public flow is_valid_crawl_policy(policy: CrawlPolicy) -> bool ![] {
    return policy.max_pages > 0
        && policy.max_pages <= 1000
        && policy.max_bytes > 0
        && policy.max_bytes <= 10485760
        && policy.obey_robots;
}

public flow empty_crawl_result(start: Url) -> CrawlResult ![] {
    let pages: Array<Untrusted<WebPage>> = [];
    return CrawlResult {
        start = start,
        pages = pages,
        limit_reached = false,
        message = "",
    };
}

public flow crawl(start: Url, policy: CrawlPolicy) -> CrawlResult ![EdkWeb.crawl, Error<WebError>] {
    return perform EdkWeb.crawl(start, policy);
}

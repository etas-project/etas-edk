module edk.web.mocks.search_index;

import std.text.{contains, lowercase};
import std.security.trust.Untrusted;
import edk.http.types.Url;
import edk.web.search.is_valid_search_query;
import edk.web.types.{CrawlResult, SearchQuery, SearchResult, WebPage};

public flow count_results(results: Array<SearchResult>) -> i32 ![] {
    var total = 0;
    for result in results limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow count_untrusted_results(results: Array<Untrusted<SearchResult>>) -> i32 ![] {
    var total = 0;
    for result in results limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow filter_results(query: SearchQuery, results: Array<SearchResult>) -> Array<Untrusted<SearchResult>> ![] {
    var matches: Array<Untrusted<SearchResult>> = [];
    if !is_valid_search_query(query) {
        return matches;
    }

    var matched = 0;
    let query_text = lowercase(query.text);
    for result in results limit Iterations(65536) {
        if matched < query.limit {
            let title = lowercase(result.title);
            let snippet = lowercase(result.snippet.text);
            var result_matches = false;
            if contains(title, query_text) {
                result_matches = true;
            }
            if contains(snippet, query_text) {
                result_matches = true;
            }
            if result_matches {
                matches = matches.push(Untrusted(result));
                matched = matched + 1;
            }
        }
    }
    return matches;
}

public flow page(url: Url, status: i32, media_type: string, title: string, body: string) -> WebPage ![] {
    let links: Array<Url> = [];
    return WebPage {
        url = url,
        status = status,
        media_type = media_type,
        title = title,
        body = body,
        links = links,
    };
}

public flow untrusted_page(url: Url, status: i32, media_type: string, title: string, body: string) -> Untrusted<WebPage> ![] {
    return Untrusted(page(url, status, media_type, title, body));
}

public flow count_untrusted_pages(pages: Array<Untrusted<WebPage>>) -> i32 ![] {
    var total = 0;
    for page in pages limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow crawl_result(start: Url, pages: Array<Untrusted<WebPage>>, limit_reached: bool, message: string) -> CrawlResult ![] {
    return CrawlResult {
        start = start,
        pages = pages,
        limit_reached = limit_reached,
        message = message,
    };
}

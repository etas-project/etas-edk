module edk.web.types;

import edk.http.types.Url;

public alias SearchQuery = {
    text: string,
    provider: string,
    limit: i32,
    language: string,
};

public alias WebSnippet = {
    text: string,
    source: string,
};

public alias SearchResult = {
    title: string,
    url: Url,
    snippet: WebSnippet,
    rank: i32,
};

public alias WebPage = {
    url: Url,
    status: i32,
    media_type: string,
    title: string,
    body: string,
    links: Array<Url>,
};

public alias CrawlPolicy = {
    max_pages: i32,
    same_domain: bool,
    obey_robots: bool,
    max_bytes: i32,
};

public alias CrawlResult = {
    start: Url,
    pages: Array<Untrusted<WebPage>>,
    limit_reached: bool,
    message: string,
};

public alias RobotsDecision = {
    allowed: bool,
    reason: string,
};

public alias SanitizedHtml = {
    html: Sanitized<string>,
    source_url: Url,
};

public alias WebFetchOptions = {
    timeout_millis: i32,
    max_bytes: i32,
    accept: string,
};

public alias HtmlExtractResult = {
    title: string,
    text: string,
    links: Array<Url>,
};

module edk.browser.types;

public type BrowserSessionRef;
public type MockBrowserSessionRef;

public spec BrowserSession;
public spec MockBrowserSession;

impl BrowserSessionRef ~ BrowserSession;
impl MockBrowserSessionRef ~ MockBrowserSession;

public alias BrowserProfileRef = {
    name: string,
};

public alias UrlSpec = {
    scheme: string,
    host: string,
    path: string,
};

public type Url = UrlSpec;

public alias SelectorSpec = {
    kind: string,
    value: string,
};

public type Selector = SelectorSpec;

public spec ParsedSelector;

impl Selector ~ ParsedSelector;

public alias DomNode = {
    tag: string,
    id: string,
    text: string,
};

public alias PageSnapshot = {
    url: Url,
    title: string,
    text: string,
    nodes: Array<DomNode>,
};

public alias ClickOptions = {
    wait_after_millis: i32,
    high_impact: bool,
};

public alias NavigationOptions = {
    timeout_millis: i32,
    wait_until: string,
};

public alias ScreenshotRef = {
    id: string,
    media_type: string,
};

public alias ScreenshotRequest<S ~ BrowserSession> = {
    session: S,
    media_type: string,
    full_page: bool,
};

public alias BrowserScreenshotRequest = ScreenshotRequest<BrowserSessionRef>;

public alias DomSummary = {
    node_count: i32,
    text: string,
};

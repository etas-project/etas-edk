module edk.web.errors;

public type WebError = {
    code: string,
    message: string,
};

public type SearchError = {
    provider: string,
    message: string,
};

public type FetchError = {
    url: string,
    message: string,
};

public type RobotsError = {
    host: string,
    message: string,
};

public type ContentTooLargeError = {
    limit: i32,
    actual: i32,
    message: string,
};

public type UnsupportedContentTypeError = {
    media_type: string,
    message: string,
};

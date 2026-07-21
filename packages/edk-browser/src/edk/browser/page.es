module edk.browser.page;

import std.text.{contains, join, lowercase, split, starts_with, trim};
import edk.browser.effects.EdkBrowser;
import edk.browser.errors.BrowserError;
import edk.browser.types.{BrowserSession, DomNode, PageSnapshot, ParsedSelector, Url, UrlSpec};

flow normalize_path(path: string) -> string ![] {
    let normalized = trim(path);
    if normalized == "" {
        return "/";
    }
    if starts_with(normalized, "/") {
        return normalized;
    }
    return join(["", normalized], "/");
}

flow browser_error(kind: string, message: string) -> BrowserError ![] {
    return BrowserError {
        kind = kind,
        message = message,
    };
}

flow raw_url(scheme: string, host: string, path: string) -> UrlSpec ![] {
    return UrlSpec {
        scheme = lowercase(trim(scheme)),
        host = lowercase(trim(host)),
        path = normalize_path(path),
    };
}

flow raw_url_ref(value: UrlSpec) -> Url ![] {
    return Url {
        scheme = value.scheme,
        host = value.host,
        path = value.path,
    };
}

public flow url(scheme: string, host: string, path: string) -> Result<Url, BrowserError> ![] {
    let value = raw_url(scheme, host, path);
    if !is_valid_url_spec(value) {
        return Err(browser_error("invalid_url", "browser URL is invalid"));
    }
    return Ok(raw_url_ref(value));
}

public flow https(host: string, path: string) -> Result<Url, BrowserError> ![] {
    return url("https", host, path);
}

public flow url_value(target: Url) -> UrlSpec ![] {
    return UrlSpec {
        scheme = target.scheme,
        host = target.host,
        path = target.path,
    };
}

public flow is_supported_url_scheme(scheme: string) -> bool ![] {
    let normalized = lowercase(trim(scheme));
    return normalized == "http" || normalized == "https";
}

flow ends_with_text(value: string, suffix: string) -> bool ![] {
    if suffix == "" {
        return true;
    }
    if !contains(value, suffix) {
        return false;
    }
    var last = value;
    for part in split(value, suffix) limit Iterations(65536) {
        last = part;
    }
    return last == "";
}

flow is_safe_host_label(label: string) -> bool ![] {
    return label != ""
        && !starts_with(label, "-")
        && !ends_with_text(label, "-")
        && !contains(label, "_");
}

flow is_safe_host_token(host: string) -> bool ![] {
    let normalized = lowercase(trim(host));
    if normalized == "" || starts_with(normalized, ".") || ends_with_text(normalized, ".") {
        return false;
    }
    if contains(normalized, " ")
        || contains(normalized, "/")
        || contains(normalized, "\\")
        || contains(normalized, ":")
        || contains(normalized, "?")
        || contains(normalized, "#")
        || contains(normalized, "@")
        || contains(normalized, "..")
        || contains(normalized, "\t")
        || contains(normalized, "\n")
        || contains(normalized, "\r")
    {
        return false;
    }
    for label in split(normalized, ".") limit Iterations(128) {
        if !is_safe_host_label(label) {
            return false;
        }
    }
    return true;
}

public flow is_valid_url_spec(target: UrlSpec) -> bool ![] {
    return is_supported_url_scheme(target.scheme)
        && is_safe_host_token(target.host)
        && target.path != ""
        && starts_with(target.path, "/")
        && !contains(target.path, " ")
        && !contains(target.path, "\t")
        && !contains(target.path, "\\")
        && !contains(target.path, "://")
        && !contains(target.path, "#")
        && !contains(target.path, "\n")
        && !contains(target.path, "\r");
}

public flow is_valid_url(target: Url) -> bool ![] {
    return is_valid_url_spec(url_value(target));
}

public flow dom_node(tag: string, id: string, text: string) -> DomNode ![] {
    return DomNode {
        tag = lowercase(trim(tag)),
        id = trim(id),
        text = text,
    };
}

public flow empty_snapshot(url: Url) -> PageSnapshot ![] {
    let nodes: Array<DomNode> = [];
    return PageSnapshot {
        url = url,
        title = "",
        text = "",
        nodes = nodes,
    };
}

public flow navigate<S ~ BrowserSession>(session: S, url: Url) -> PageSnapshot ![EdkBrowser.navigate, Error<BrowserError>] {
    return perform EdkBrowser.navigate(session, url);
}

public flow click<S ~ BrowserSession, P ~ ParsedSelector>(session: S, selector: P) -> PageSnapshot ![EdkBrowser.click, Error<BrowserError>] {
    return perform EdkBrowser.click(session, selector);
}

public flow read<S ~ BrowserSession>(session: S) -> PageSnapshot ![EdkBrowser.read, Error<BrowserError>] {
    return perform EdkBrowser.read(session);
}

module edk.browser.session;

import std.text.{contains, lowercase, split, starts_with, trim};
import edk.browser.effects.EdkBrowser;
import edk.browser.errors.BrowserError;
import edk.browser.page.is_valid_url;
import edk.browser.types.{BrowserProfileRef, BrowserSessionRef, NavigationOptions, Url};

public flow browser_profile(name: string) -> BrowserProfileRef ![] {
    return BrowserProfileRef { name = trim(name) };
}

flow browser_error(kind: string, message: string) -> BrowserError ![] {
    return BrowserError {
        kind = kind,
        message = message,
    };
}

flow check_session_target(profile: BrowserProfileRef, origin: Url) -> unit ![Error<BrowserError>] {
    if !is_valid_browser_profile(profile) {
        return perform Error<BrowserError>.raise(browser_error("invalid_profile", "browser profile is invalid"));
    }
    if !is_valid_url(origin) {
        return perform Error<BrowserError>.raise(browser_error("invalid_origin", "browser origin is invalid"));
    }
    return;
}

public flow create_session(profile: BrowserProfileRef, origin: Url) -> BrowserSessionRef ![EdkBrowser.create, Error<BrowserError>] {
    check_session_target(profile, origin);
    return perform EdkBrowser.create(profile, origin);
}

public flow attach_session(profile: BrowserProfileRef, origin: Url) -> BrowserSessionRef ![EdkBrowser.attach, Error<BrowserError>] {
    check_session_target(profile, origin);
    return perform EdkBrowser.attach(profile, origin);
}

public flow default_navigation_options() -> NavigationOptions ![] {
    return NavigationOptions {
        timeout_millis = 30000,
        wait_until = "load",
    };
}

public flow navigation_options(timeout_millis: i32, wait_until: string) -> NavigationOptions ![] {
    return NavigationOptions {
        timeout_millis = timeout_millis,
        wait_until = trim(wait_until),
    };
}

flow count_origin_parts(origin: string) -> i32 ![] {
    var total = 0;
    for part in split(origin, "://") limit Iterations(8) {
        total = total + 1;
    }
    return total;
}

flow origin_part(origin: string, desired_index: i32) -> string ![] {
    var index = 0;
    var value = "";
    for part in split(origin, "://") limit Iterations(8) {
        if index == desired_index {
            value = part;
        }
        index = index + 1;
    }
    return value;
}

flow is_supported_origin_scheme(scheme: string) -> bool ![] {
    return scheme == "http" || scheme == "https";
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

flow is_safe_origin_label(label: string) -> bool ![] {
    return label != ""
        && !starts_with(label, "-")
        && !ends_with_text(label, "-")
        && !contains(label, "_");
}

flow is_safe_origin_host(host: string) -> bool ![] {
    if host == "" || starts_with(host, ".") || ends_with_text(host, ".") {
        return false;
    }
    if contains(host, " ")
        || contains(host, "/")
        || contains(host, "\\")
        || contains(host, ":")
        || contains(host, "?")
        || contains(host, "#")
        || contains(host, "@")
        || contains(host, "..")
        || contains(host, "\t")
        || contains(host, "\n")
        || contains(host, "\r")
    {
        return false;
    }
    for label in split(host, ".") limit Iterations(128) {
        if !is_safe_origin_label(label) {
            return false;
        }
    }
    return true;
}

public flow is_valid_origin(origin: string) -> bool ![] {
    let normalized = lowercase(trim(origin));
    return count_origin_parts(normalized) == 2
        && is_supported_origin_scheme(origin_part(normalized, 0))
        && is_safe_origin_host(origin_part(normalized, 1));
}

public flow is_valid_browser_profile(profile: BrowserProfileRef) -> bool ![] {
    return profile.name != ""
        && !contains(profile.name, "/")
        && !contains(profile.name, "\\")
        && !contains(profile.name, ":")
        && !contains(profile.name, "?")
        && !contains(profile.name, "#")
        && !contains(profile.name, "\t")
        && !contains(profile.name, "\n")
        && !contains(profile.name, "\r");
}

public flow is_valid_navigation_options(options: NavigationOptions) -> bool ![] {
    return options.timeout_millis > 0
        && (options.wait_until == "load"
            || options.wait_until == "domcontentloaded"
            || options.wait_until == "networkidle");
}

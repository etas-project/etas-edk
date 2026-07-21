module edk.browser.screenshot;

import std.text.{contains, lowercase, trim};
import edk.browser.types.{BrowserSession, ScreenshotRef, ScreenshotRequest};

flow normalize_media_type(media_type: string) -> string ![] {
    return lowercase(trim(media_type));
}

public flow screenshot_ref(id: string, media_type: string) -> ScreenshotRef ![] {
    return ScreenshotRef {
        id = trim(id),
        media_type = normalize_media_type(media_type),
    };
}

public flow screenshot_request<S ~ BrowserSession>(session: S, media_type: string, full_page: bool) -> ScreenshotRequest<S> ![] {
    return ScreenshotRequest<S> {
        session = session,
        media_type = normalize_media_type(media_type),
        full_page = full_page,
    };
}

public flow is_supported_screenshot_media_type(media_type: string) -> bool ![] {
    let normalized = normalize_media_type(media_type);
    return normalized == "image/png" || normalized == "image/jpeg" || normalized == "image/webp";
}

public flow is_valid_screenshot_ref(reference: ScreenshotRef) -> bool ![] {
    return reference.id != ""
        && is_supported_screenshot_media_type(reference.media_type)
        && !contains(reference.id, "/")
        && !contains(reference.id, "\\")
        && !contains(reference.id, ":")
        && !contains(reference.id, "\t")
        && !contains(reference.id, "\n")
        && !contains(reference.id, "\r");
}

public flow is_valid_screenshot_request<S ~ BrowserSession>(request: ScreenshotRequest<S>) -> bool ![] {
    return is_supported_screenshot_media_type(request.media_type);
}

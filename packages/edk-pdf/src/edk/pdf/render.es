module edk.pdf.render;

import edk.pdf.types.PageRenderOptions;
import std.text.{contains, lowercase, trim};

public flow normalize_render_format(format: string) -> string ![] {
    return lowercase(trim(format));
}

public flow render_options(page: i32, dpi: i32, format: string) -> PageRenderOptions ![] {
    return PageRenderOptions {
        page = page,
        dpi = dpi,
        format = normalize_render_format(format),
    };
}

public flow default_render_options(page: i32) -> PageRenderOptions ![] {
    return render_options(page, 144, "png");
}

public flow is_supported_render_format(format: string) -> bool ![] {
    let normalized = normalize_render_format(format);
    return !contains(normalized, "\n")
        && !contains(normalized, "\r")
        && (normalized == "png" || normalized == "jpeg");
}

public flow is_valid_render_options(options: PageRenderOptions) -> bool ![] {
    return options.page > 0
        && options.dpi >= 72
        && options.dpi <= 600
        && is_supported_render_format(options.format);
}

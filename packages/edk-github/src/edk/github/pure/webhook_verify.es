module edk.github.pure.webhook_verify;

import std.text.{contains, starts_with, trim};
import edk.github.types.WebhookVerification;

public flow verify_signature_header(signature: string) -> WebhookVerification ![] {
    let value = trim(signature);
    if starts_with(value, "sha256=")
        && value != "sha256="
        && !contains(value, " ")
        && !contains(value, "\n")
        && !contains(value, "\r")
        && !contains(value, "\t")
    {
        return WebhookVerification {
            ok = true,
            message = "",
        };
    }
    return WebhookVerification {
        ok = false,
        message = "missing sha256 signature",
    };
}

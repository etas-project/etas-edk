module edk.http.pure.ssrf;

import edk.http.types.Host;
import edk.http.url.scope.is_private_or_reserved_host;

public flow is_ssrf_risk_host(host: Host) -> bool ![] {
    return is_private_or_reserved_host(host);
}

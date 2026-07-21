module edk.http.pure.redirect;

import edk.http.pure.status.is_redirect_status;
import edk.http.types.RedirectPolicy;

public flow should_follow_redirect(status: i32, policy: RedirectPolicy, current_hops: i32) -> bool ![] {
    return policy.follow && current_hops < policy.max_hops && is_redirect_status(status);
}

public flow redirect_limit_exceeded(policy: RedirectPolicy, current_hops: i32) -> bool ![] {
    return policy.follow && current_hops >= policy.max_hops;
}

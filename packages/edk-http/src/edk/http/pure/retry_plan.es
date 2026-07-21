module edk.http.pure.retry_plan;

import edk.http.pure.status.is_server_error_status;
import edk.http.types.RetryPolicy;

public flow should_retry_status(status: i32, attempt: i32, policy: RetryPolicy) -> bool ![] {
    return is_server_error_status(status) && attempt < policy.max_attempts;
}

public flow retry_delay_millis(attempt: i32, policy: RetryPolicy) -> i32 ![] {
    return attempt * policy.backoff_millis;
}

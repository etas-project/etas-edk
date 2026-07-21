module edk.http.pure.status;

public flow is_valid_status(status: i32) -> bool ![] {
    return status >= 100 && status <= 599;
}

public flow is_success_status(status: i32) -> bool ![] {
    return status >= 200 && status <= 299;
}

public flow is_redirect_status(status: i32) -> bool ![] {
    return status >= 300 && status <= 399;
}

public flow is_client_error_status(status: i32) -> bool ![] {
    return status >= 400 && status <= 499;
}

public flow is_server_error_status(status: i32) -> bool ![] {
    return status >= 500 && status <= 599;
}

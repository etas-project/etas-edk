module tests.edk.negative.edk_email_raw_smtp_endpoint_not_tls_required.main;

import edk.email.types.{SmtpEndpoint, TlsRequiredEndpoint};

flow requires_tls_endpoint[E: TlsRequiredEndpoint](endpoint: E) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let endpoint = SmtpEndpoint {
        host = "smtp.example.com",
        port = 25,
        tls = false,
    };
    return requires_tls_endpoint(endpoint);
}

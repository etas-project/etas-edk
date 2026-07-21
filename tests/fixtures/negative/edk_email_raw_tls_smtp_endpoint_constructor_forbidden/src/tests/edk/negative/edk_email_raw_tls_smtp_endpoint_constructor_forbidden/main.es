module tests.edk.negative.edk_email_raw_tls_smtp_endpoint_constructor_forbidden.main;

import edk.email.smtp.is_valid_smtp_endpoint;
import edk.email.types.{SmtpEndpoint, TlsSmtpEndpoint};

flow main(args: Array<string>) -> i32 ![] {
    let forged = TlsSmtpEndpoint(SmtpEndpoint {
        host = "smtp.example.com",
        port = 25,
        tls = false,
    });
    if is_valid_smtp_endpoint(forged) {
        return 1;
    }
    return 0;
}

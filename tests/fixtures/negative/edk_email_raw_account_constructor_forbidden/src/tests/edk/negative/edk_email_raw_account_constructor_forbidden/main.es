module tests.edk.negative.edk_email_raw_account_constructor_forbidden.main;

import edk.email.effects.EdkEmail;
import edk.email.errors.{AddressError, EmailError};
import edk.email.address.parse_address;
import edk.email.provider.send;
import edk.email.message.{draft_to_one, with_idempotency_key};
import edk.email.types.{EmailAccount, EmailAccountSpec, EmailAddress};

flow checked_address(value: string) -> EmailAddress ![Error<AddressError>] {
    return match parse_address(value) {
        Ok(address) => address,
        Err(error) => perform Error<AddressError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkEmail.send, Error<AddressError>, Error<EmailError>] {
    let address = checked_address("ops@example.com");
    let spec = EmailAccountSpec {
        id = "ops/team",
        provider = "example",
        address = address,
    };
    let forged = EmailAccount(spec);
    let draft = with_idempotency_key(draft_to_one(address, "Report", "ready"), "raw-account-forbidden");
    let receipt = send(forged, draft);
    return 0;
}

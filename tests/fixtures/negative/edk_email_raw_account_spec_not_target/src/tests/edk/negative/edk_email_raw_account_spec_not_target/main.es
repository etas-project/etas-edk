module tests.edk.negative.edk_email_raw_account_spec_not_target.main;

import edk.email.errors.AddressError;
import edk.email.address.parse_address;
import edk.email.types.{EmailAccountSpec, EmailAccountTarget, EmailAddress};

flow checked_address(value: string) -> EmailAddress ![Error<AddressError>] {
    return match parse_address(value) {
        Ok(address) => address,
        Err(error) => perform Error<AddressError>.raise(error),
    };
}

flow requires_account<A ~ EmailAccountTarget>(account: A) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![Error<AddressError>] {
    let address = checked_address("ops@example.com");
    let spec = EmailAccountSpec {
        id = "ops/team",
        provider = "example",
        address = address,
    };
    return requires_account(spec);
}

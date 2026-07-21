module edk.email.pure.address_parse;

import edk.email.address.parse_address;
import edk.email.errors.AddressError;
import edk.email.types.EmailAddress;

public flow parse(input: string) -> Result<EmailAddress, AddressError> ![] {
    return parse_address(input);
}

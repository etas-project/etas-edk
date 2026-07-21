module tests.edk.negative.edk_email_raw_provider_endpoint_constructor_forbidden.main;

import edk.email.provider.is_valid_provider_endpoint;
import edk.email.types.{ProviderEndpoint, ProviderEndpointSpec};

flow main(args: Array<string>) -> i32 ![] {
    let spec = ProviderEndpointSpec {
        name = "example",
        api_host = "api.example.com/path",
    };
    let forged = ProviderEndpoint(spec);
    if is_valid_provider_endpoint(forged) {
        return 0;
    }
    return 1;
}

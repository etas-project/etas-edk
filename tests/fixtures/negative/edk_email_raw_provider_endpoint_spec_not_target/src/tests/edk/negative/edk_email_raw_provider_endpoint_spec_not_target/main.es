module tests.edk.negative.edk_email_raw_provider_endpoint_spec_not_target.main;

import edk.email.types.{EmailProviderEndpointTarget, ProviderEndpointSpec};

flow requires_provider_endpoint[E: EmailProviderEndpointTarget](endpoint: E) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let endpoint = ProviderEndpointSpec {
        name = "example",
        api_host = "api.example.com/path",
    };
    return requires_provider_endpoint(endpoint);
}

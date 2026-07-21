module tests.edk.negative.runtime_action_scope_value_forbidden.main;

effect EdkProbe extends Network {
    action request(request: ProbeRequest) -> i32;
}

type ProbeRequest = {
    host: string,
};

flow main(args: Array<string>) -> i32 ![EdkProbe.request] {
    let request = ProbeRequest { host = "example.com" };
    return perform EdkProbe.request<request.host>(request);
}

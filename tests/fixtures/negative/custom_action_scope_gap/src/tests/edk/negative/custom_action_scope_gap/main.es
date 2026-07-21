module tests.edk.negative.custom_action_scope_gap.main;

effect EdkProbe extends Network {
    action request(request: ProbeRequest) -> i32;
}

type ProbeRequest = {
    method: string,
    host: string,
};

flow main(args: Array<string>) -> i32 ![EdkProbe.request] {
    let request = ProbeRequest { method = "GET", host = "example.com" };
    return perform EdkProbe.request<request.host>(request);
}

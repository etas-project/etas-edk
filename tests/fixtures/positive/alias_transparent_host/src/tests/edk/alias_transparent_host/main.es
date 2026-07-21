module tests.edk.alias_transparent_host.main;

alias Host = string;

flow round_trip(host: Host) -> Host ![] {
    return host;
}

flow main(args: Array<string>) -> i32 ![] {
    let host = round_trip("example.com");
    if host != "example.com" {
        return 1;
    }
    return 0;
}

module tests.edk.negative.removed_std_actions.main;

flow main(args: Array<string>) -> i32 ![
    Agentic.embed,
    Command.spawn,
    Memory.migrate,
] {
    return 0;
}

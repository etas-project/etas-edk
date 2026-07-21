module tests.edk.negative.removed_std_vocabulary.main;

flow main(args: Array<string>) -> i32 ![
    Workspace.read,
    Db.query,
    Vector.search,
    Browser.navigate,
    Email.send,
    Payment.charge,
    Agentic.embed,
    Command.spawn,
    Memory.migrate,
] {
    return 0;
}

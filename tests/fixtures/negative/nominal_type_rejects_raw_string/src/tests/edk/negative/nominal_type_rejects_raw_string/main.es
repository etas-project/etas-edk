module tests.edk.negative.nominal_type_rejects_raw_string.main;

type UserId = string;

flow takes_user(id: UserId) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    return takes_user("u1");
}

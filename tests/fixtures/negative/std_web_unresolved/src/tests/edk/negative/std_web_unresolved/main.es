module tests.edk.negative.std_web_unresolved.main;

flow main(args: Array<string>) -> i32 ![Web.search] {
    return 0;
}

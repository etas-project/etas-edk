module edk.eval.errors;

public type EvalError = {
    code: string,
    message: string,
};

public type GoldenMismatchError = {
    expected: string,
    actual: string,
};

public type TraceMismatchError = {
    expected: string,
    actual: string,
};

public type FixtureError = {
    suite: string,
    message: string,
};

public type AssertionError = {
    message: string,
};

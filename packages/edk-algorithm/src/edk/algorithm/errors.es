module edk.algorithm.errors;

public alias AlgorithmError = {
    code: string,
    message: string,
};

public alias CycleError = {
    node: i32,
    message: string,
};

public alias NoPathError = {
    start: i32,
    goal: i32,
};

public alias InvalidGraphError = {
    node: i32,
    message: string,
};

public alias InvalidWeightError = {
    weight: i32,
    message: string,
};

public alias SearchLimitError = {
    max_steps: i32,
    message: string,
};

public alias ScheduleConflictError = {
    task: i32,
    message: string,
};

public alias DimensionError = {
    left: i32,
    right: i32,
};

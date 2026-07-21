module edk.algorithm.scheduling;

import edk.algorithm.pure.array_helpers.{contains_i32, repeat_bool, repeat_i32};
import edk.algorithm.types.{Dependency, Schedule};

public flow schedule_dependencies(tasks: Array<i32>, dependencies: Array<Dependency>) -> Schedule
    ![Error<IndexError>]
{
    let empty_order: Array<i32> = [];
    if has_duplicate_tasks(tasks) {
        return Schedule { order = empty_order, feasible = false };
    }

    let total = count_tasks(tasks);
    var indegree = repeat_i32(0, total);
    for dependency in dependencies limit Iterations(65536) {
        let prerequisite_index = task_index(tasks, dependency.prerequisite);
        let dependent_index = task_index(tasks, dependency.dependent);
        if prerequisite_index == -1 || dependent_index == -1 {
            return Schedule { order = empty_order, feasible = false };
        }
        indegree[dependent_index] = indegree[dependent_index] + 1;
    }

    var emitted = repeat_bool(false, total);
    var order: Array<i32> = [];
    var emitted_count = 0;

    while emitted_count < total limit Iterations(65536) {
        let current = smallest_ready_task_index(tasks, indegree, emitted);
        if current == -1 {
            return Schedule { order = order, feasible = false };
        }

        emitted[current] = true;
        order = order.push(tasks[current]);
        emitted_count = emitted_count + 1;

        for dependency in dependencies limit Iterations(65536) {
            if dependency.prerequisite == tasks[current] {
                let dependent_index = task_index(tasks, dependency.dependent);
                if dependent_index != -1 {
                    indegree[dependent_index] = indegree[dependent_index] - 1;
                }
            }
        }
    }

    return Schedule { order = order, feasible = true };
}

flow count_tasks(tasks: Array<i32>) -> i32 ![] {
    var count = 0;
    for task in tasks limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

flow task_index(tasks: Array<i32>, task: i32) -> i32 ![] {
    var index = 0;
    for candidate in tasks limit Iterations(65536) {
        if candidate == task {
            return index;
        }
        index = index + 1;
    }
    return -1;
}

flow has_duplicate_tasks(tasks: Array<i32>) -> bool ![] {
    var seen: Array<i32> = [];
    for task in tasks limit Iterations(65536) {
        if contains_i32(seen, task) {
            return true;
        }
        seen = seen.push(task);
    }
    return false;
}

flow smallest_ready_task_index(tasks: Array<i32>, indegree: Array<i32>, emitted: Array<bool>) -> i32
    ![Error<IndexError>]
{
    var best = -1;
    var index = 0;
    for task in tasks limit Iterations(65536) {
        if !emitted[index] && indegree[index] == 0 && (best == -1 || task < tasks[best]) {
            best = index;
        }
        index = index + 1;
    }
    return best;
}

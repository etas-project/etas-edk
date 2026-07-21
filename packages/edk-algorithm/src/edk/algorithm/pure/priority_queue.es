module edk.algorithm.pure.priority_queue;

import edk.algorithm.pure.array_helpers.count_i32;

public alias PriorityItem = {
    value: i32,
    priority: i32,
    sequence: i32,
};

public alias PriorityItemQueue = {
    items: Array<PriorityItem>,
};

public alias PriorityPop = {
    found: bool,
    item: PriorityItem,
    queue: PriorityItemQueue,
};

public flow priority_item(value: i32, priority: i32, sequence: i32) -> PriorityItem ![] {
    return PriorityItem {
        value = value,
        priority = priority,
        sequence = sequence,
    };
}

public flow empty_queue() -> PriorityItemQueue ![] {
    let items: Array<PriorityItem> = [];
    return PriorityItemQueue { items = items };
}

public flow queue_size(queue: PriorityItemQueue) -> i32 ![] {
    var count = 0;
    for item in queue.items limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

public flow is_empty(queue: PriorityItemQueue) -> bool ![] {
    return queue_size(queue) == 0;
}

public flow push(queue: PriorityItemQueue, item: PriorityItem) -> PriorityItemQueue ![] {
    return PriorityItemQueue { items = queue.items.push(item) };
}

flow higher_priority(left: PriorityItem, right: PriorityItem) -> bool ![] {
    if left.priority < right.priority {
        return true;
    }
    if left.priority > right.priority {
        return false;
    }
    return left.sequence < right.sequence;
}

flow sentinel_item() -> PriorityItem ![] {
    return PriorityItem { value = 0, priority = 0, sequence = 0 };
}

public flow peek_min(queue: PriorityItemQueue) -> PriorityPop ![Error<IndexError>] {
    let size = queue_size(queue);
    if size == 0 {
        return PriorityPop {
            found = false,
            item = sentinel_item(),
            queue = queue,
        };
    }

    var best_index = 0;
    var i = 1;
    while i < size limit Iterations(65536) {
        if higher_priority(queue.items[i], queue.items[best_index]) {
            best_index = i;
        }
        i = i + 1;
    }

    return PriorityPop {
        found = true,
        item = queue.items[best_index],
        queue = queue,
    };
}

public flow pop_min(queue: PriorityItemQueue) -> PriorityPop ![Error<IndexError>] {
    let size = queue_size(queue);
    if size == 0 {
        return PriorityPop {
            found = false,
            item = sentinel_item(),
            queue = queue,
        };
    }

    let peeked = peek_min(queue);
    var out: Array<PriorityItem> = [];
    var removed = false;
    var i = 0;
    while i < size limit Iterations(65536) {
        let item = queue.items[i];
        if !removed
            && item.value == peeked.item.value
            && item.priority == peeked.item.priority
            && item.sequence == peeked.item.sequence
        {
            removed = true;
        } else {
            out = out.push(item);
        }
        i = i + 1;
    }

    return PriorityPop {
        found = true,
        item = peeked.item,
        queue = PriorityItemQueue { items = out },
    };
}

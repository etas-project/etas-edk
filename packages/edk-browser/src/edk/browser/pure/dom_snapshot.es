module edk.browser.pure.dom_snapshot;

import std.text.{contains, join, trim};
import edk.browser.types.{DomNode, DomSummary, PageSnapshot};

flow count_nodes(nodes: Array<DomNode>) -> i32 ![] {
    var total = 0;
    for node in nodes limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow count_snapshot_nodes(snapshot: PageSnapshot) -> i32 ![] {
    return count_nodes(snapshot.nodes);
}

public flow snapshot_contains_text(snapshot: PageSnapshot, text: string) -> bool ![] {
    let needle = trim(text);
    if needle == "" {
        return false;
    }
    if contains(snapshot.text, needle) || contains(snapshot.title, needle) {
        return true;
    }
    for node in snapshot.nodes limit Iterations(65536) {
        if contains(node.text, needle) {
            return true;
        }
    }
    return false;
}

public flow summarize(snapshot: PageSnapshot) -> DomSummary ![] {
    var parts: Array<string> = [];
    for node in snapshot.nodes limit Iterations(65536) {
        parts = parts.push(node.text);
    }
    return DomSummary {
        node_count = count_nodes(snapshot.nodes),
        text = join(parts, "\n"),
    };
}

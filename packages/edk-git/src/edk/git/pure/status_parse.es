module edk.git.pure.status_parse;

import std.text.{lines, split, starts_with, trim};
import edk.git.repo.{branch, default_branch, git_status, status_entry};
import edk.git.types.{BranchRef, GitStatus, GitStatusEntry};

flow branch_from_head_line(line: string) -> BranchRef ![] {
    let text = trim(line);
    var name = "";
    var seen_hash = false;
    var seen_space = false;
    for part in split(text, " ") limit Iterations(64) {
        if part == "##" {
            seen_hash = true;
            continue;
        }
        if seen_hash && !seen_space {
            name = part;
            seen_space = true;
            continue;
        }
        if seen_hash && seen_space {
            break;
        }
    }
    if name == "" {
        return default_branch();
    }
    match branch(name) {
        Ok(b) => { return b; }
        Err(_) => { return default_branch(); }
    }
}

public flow parse_porcelain_status(text: string) -> GitStatus ![] {
    var entries: Array<GitStatusEntry> = [];
    var current_branch: BranchRef = default_branch();
    for line in lines(text) limit Iterations(65536) {
        let trimmed = trim(line);
        if trimmed == "" {
            continue;
        }
        if starts_with(trimmed, "## ") {
            current_branch = branch_from_head_line(trimmed);
            continue;
        }
        var state = "";
        var path = "";
        var first = true;
        for part in split(trimmed, " ") limit Iterations(256) {
            if first {
                state = part;
                first = false;
            } else {
                if path != "" {
                    path = path + " ";
                }
                path = path + part;
            }
        }
        if state != "" && path != "" {
            match status_entry(path, state) {
                Ok(entry) => {
                    entries = entries.push(entry);
                }
                Err(_) => {}
            }
        }
    }
    return git_status(current_branch, entries);
}

public flow count_porcelain_entries(text: string) -> i32 ![] {
    let status = parse_porcelain_status(text);
    var count = 0;
    for entry in status.entries limit Iterations(65536) {
        count = count + 1;
    }
    return count;
}

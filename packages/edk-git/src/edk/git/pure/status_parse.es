module edk.git.pure.status_parse;

import std.text.{lines, split_once, starts_with, strip_prefix, trim};
import edk.git.repo.{branch, default_branch, git_status, status_entry};
import edk.git.types.{BranchRef, GitStatus, GitStatusEntry};

flow branch_from_head_line(line: string) -> BranchRef ![] {
    let header = match strip_prefix(line, "## ") {
        Some(value) => value,
        None => "",
    };
    let name = match split_once(header, "...") {
        Some((local, _)) => local,
        None => header,
    };
    match branch(name) {
        Ok(b) => { return b; }
        Err(_) => { return default_branch(); }
    }
}

public flow parse_porcelain_status(text: string) -> GitStatus ![] {
    var entries: Array<GitStatusEntry> = [];
    var current_branch: BranchRef = default_branch();
    for line in lines(text) {
        let trimmed = trim(line);
        if trimmed == "" {
            continue;
        }
        if starts_with(trimmed, "## ") {
            current_branch = branch_from_head_line(trimmed);
            continue;
        }
        match split_once(trimmed, " ") {
            Some((state, path)) => {
                match status_entry(trim(path), state) {
                    Ok(entry) => { entries = entries.push(entry); }
                    Err(_) => {}
                }
            }
            None => {}
        }
    }
    return git_status(current_branch, entries);
}

public flow count_porcelain_entries(text: string) -> i32 ![] {
    let status = parse_porcelain_status(text);
    var count = 0;
    for entry in status.entries {
        count = count + 1;
    }
    return count;
}

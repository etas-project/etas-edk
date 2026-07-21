module edk.git.pure.diff_parse;

import std.text.{lines, split, starts_with};
import edk.git.diff.diff_file;
import edk.git.types.{GitDiff, GitDiffFile};

flow parse_diff_header(line: string) -> GitDiffFile ![] {
    var index = 0;
    var old_path = "";
    var new_path = "";
    for part in split(line, " ") limit Iterations(64) {
        if index == 2 {
            old_path = part;
        }
        if index == 3 {
            new_path = part;
        }
        index = index + 1;
    }
    return diff_file(old_path, new_path, 0);
}

public flow count_diff_files(diff: GitDiff) -> i32 ![] {
    var total = 0;
    for file in diff.files limit Iterations(65536) {
        total = total + 1;
    }
    return total;
}

public flow count_total_hunks(diff: GitDiff) -> i32 ![] {
    var total = 0;
    for file in diff.files limit Iterations(65536) {
        total = total + file.hunks;
    }
    return total;
}

public flow parse_file_headers(text: string) -> GitDiff ![] {
    var files: Array<GitDiffFile> = [];
    var has_current = false;
    var current_old = "";
    var current_new = "";
    var hunks = 0;
    for line in lines(text) limit Iterations(65536) {
        if starts_with(line, "diff --git ") {
            if has_current {
                files = files.push(diff_file(current_old, current_new, hunks));
            }
            let header = parse_diff_header(line);
            current_old = header.old_path;
            current_new = header.new_path;
            hunks = 0;
            has_current = true;
        }
        if starts_with(line, "@@") {
            hunks = hunks + 1;
        }
    }
    if has_current {
        files = files.push(diff_file(current_old, current_new, hunks));
    }
    return GitDiff {
        files = files,
        text = text,
    };
}

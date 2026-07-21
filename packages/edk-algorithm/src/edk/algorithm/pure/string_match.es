module edk.algorithm.pure.string_match;

import std.text.{contains, lowercase, split, starts_with, trim};

public alias StringMatch = {
    matched: bool,
    score: i32,
    reason: string,
};

public flow exact(left: string, right: string) -> StringMatch ![] {
    let matched = trim(left) == trim(right);
    var score = 0;
    if matched {
        score = 100;
    }
    return StringMatch {
        matched = matched,
        score = score,
        reason = "exact",
    };
}

public flow contains_text(haystack: string, needle: string) -> StringMatch ![] {
    let matched = contains(lowercase(haystack), lowercase(trim(needle)));
    var score = 0;
    if matched {
        score = 60;
    }
    return StringMatch {
        matched = matched,
        score = score,
        reason = "contains",
    };
}

public flow prefix(value: string, expected_prefix: string) -> StringMatch ![] {
    let matched = starts_with(lowercase(trim(value)), lowercase(trim(expected_prefix)));
    var score = 0;
    if matched {
        score = 80;
    }
    return StringMatch {
        matched = matched,
        score = score,
        reason = "prefix",
    };
}

public flow count_parts_after_split(value: string, separator: string) -> i32 ![] {
    var count = 0;
    for part in split(value, separator) limit Iterations(65536) {
        if trim(part) != "" {
            count = count + 1;
        }
    }
    return count;
}

module edk.web.pure.robots;

import std.text.{join, lowercase, split, starts_with, trim};
import edk.http.types.Url;
import edk.web.types.RobotsDecision;

public flow allow_all() -> RobotsDecision ![] {
    return RobotsDecision {
        allowed = true,
        reason = "",
    };
}

public flow allow(reason: string) -> RobotsDecision ![] {
    return RobotsDecision {
        allowed = true,
        reason = reason,
    };
}

public flow deny(reason: string) -> RobotsDecision ![] {
    return RobotsDecision {
        allowed = false,
        reason = reason,
    };
}

flow strip_comment(line: string) -> string ![] {
    var value = "";
    var first = true;
    for part in split(line, "#") limit Iterations(1024) {
        if first {
            value = part;
            first = false;
        }
    }
    return trim(value);
}

flow value_after_colon(line: string) -> string ![] {
    var parts: Array<string> = [];
    var seen_colon = false;
    for part in split(line, ":") limit Iterations(1024) {
        if seen_colon {
            parts = parts.push(part);
        }
        seen_colon = true;
    }
    return trim(join(parts, ":"));
}

flow rule_specificity(rule: string) -> i32 ![] {
    let value = trim(rule);
    if value == "" || value == "/" {
        return 0;
    }

    var segments = 0;
    for segment in split(value, "/") limit Iterations(65536) {
        if trim(segment) != "" {
            segments = segments + 1;
        }
    }
    return segments;
}

flow rule_matches(path: string, rule: string) -> bool ![] {
    let value = trim(rule);
    return value != "" && starts_with(path, value);
}

public flow decide(url: Url, robots_text: string) -> RobotsDecision ![] {
    let text = trim(robots_text);
    if text == "" {
        return allow_all();
    }

    var allow_score = -1;
    var deny_score = -1;
    for raw_line in split(text, "\n") limit Iterations(65536) {
        let line = strip_comment(raw_line);
        let normalized = lowercase(line);
        if starts_with(normalized, "allow:") {
            let rule = value_after_colon(line);
            if rule_matches(url.path_and_query, rule) {
                let score = rule_specificity(rule);
                if score > allow_score {
                    allow_score = score;
                }
            }
        }

        if starts_with(normalized, "disallow:") {
            let rule = value_after_colon(line);
            if rule_matches(url.path_and_query, rule) {
                let score = rule_specificity(rule);
                if score > deny_score {
                    deny_score = score;
                }
            }
        }
    }

    if allow_score >= 0 && allow_score >= deny_score {
        return allow("robots explicit allow");
    }

    if deny_score >= 0 {
        return deny("robots path disallow");
    }

    return allow_all();
}

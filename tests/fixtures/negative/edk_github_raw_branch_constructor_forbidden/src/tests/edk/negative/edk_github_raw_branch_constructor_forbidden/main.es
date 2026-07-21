module tests.edk.negative.edk_github_raw_branch_constructor_forbidden.main;

import edk.github.pr.is_valid_branch_ref;
import edk.github.types.{BranchRef, BranchSpec};

flow main(args: Array<string>) -> i32 ![] {
    let branch = BranchRef(BranchSpec { name = "../main" });
    if is_valid_branch_ref(branch) {
        return 1;
    }
    return 0;
}

module tests.edk.negative.edk_github_raw_branch_spec_not_branch_ref.main;

import edk.github.types.{BranchSpec, GitHubBranchRef};

flow requires_branch_ref[B: GitHubBranchRef](branch: B) -> i32 ![] {
    return 0;
}

flow main(args: Array<string>) -> i32 ![] {
    let branch = BranchSpec { name = "feature" };
    return requires_branch_ref(branch);
}

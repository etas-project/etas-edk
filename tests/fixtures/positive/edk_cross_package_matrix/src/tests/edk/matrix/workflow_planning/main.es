module tests.edk.matrix.workflow_planning.main;

import edk.algorithm.graph.toposort;
import edk.algorithm.scheduling.schedule_dependencies;
import edk.algorithm.types.{Dependency, DirectedGraph, Edge};
import edk.github.effects.EdkGitHub;
import edk.github.errors.GitHubError;
import edk.github.pr.{branch_ref, get_pr, is_valid_pull_request, pull_request};
import edk.github.repo.{github_repo, github_repo_value, is_valid_repo_ref};
import edk.github.types.{BranchRef, GitHubRepoRef, PullRequestRef};
import edk.workspace.effects.EdkWorkspace;
import edk.workspace.errors.WorkspaceError;
import edk.workspace.files.list;
import edk.workspace.glob.scope_matches;
import edk.workspace.path.{path_scope, workspace_path};
import edk.workspace.types.WorkspaceRootPath;

flow checked_workspace_path(value: string) -> WorkspaceRootPath ![Error<WorkspaceError>] {
    return match workspace_path(value) {
        Ok(path) => path,
        Err(error) => perform Error<WorkspaceError>.raise(error),
    };
}

flow checked_github_repo(owner: string, name: string) -> GitHubRepoRef ![Error<GitHubError>] {
    return match github_repo(owner, name) {
        Ok(repo) => repo,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_branch_ref(value: string) -> BranchRef ![Error<GitHubError>] {
    return match branch_ref(value) {
        Ok(branch) => branch,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow checked_pull_request(repo: GitHubRepoRef, number: i32, head: BranchRef, base: BranchRef) -> PullRequestRef<GitHubRepoRef, BranchRef, BranchRef> ![Error<GitHubError>] {
    return match pull_request(repo, number, head, base) {
        Ok(pr) => pr,
        Err(error) => perform Error<GitHubError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![EdkGitHub.read, EdkWorkspace.list, Secret.read, Error<GitHubError>, Error<WorkspaceError>, Error<IndexError>] {
    let graph = DirectedGraph {
        nodes = 3,
        edges = [
            Edge { from = 0, to = 1 },
            Edge { from = 1, to = 2 },
        ],
    };
    let order = toposort(graph);
    let schedule = schedule_dependencies([0, 1, 2], [
        Dependency { prerequisite = 0, dependent = 1 },
        Dependency { prerequisite = 1, dependent = 2 },
    ]);

    let repo = checked_github_repo("etas-lang", "etas");
    let head = checked_branch_ref("feature");
    let base = checked_branch_ref("main");
    let pr = checked_pull_request(repo, 7, head, base);
    let result = get_pr(repo, pr);
    let workspace_root = checked_workspace_path(".");
    let workspace_scope = path_scope(".");
    let entries = list(workspace_root);

    if !order.acyclic { return 1; }
    if !schedule.feasible { return 1; }
    if !is_valid_repo_ref(repo) { return 1; }
    if !is_valid_pull_request(pr) { return 1; }
    if !scope_matches(workspace_scope, workspace_root) { return 1; }
    if github_repo_value(repo).owner != "etas-lang" { return 1; }
    if github_repo_value(result.repo).owner != github_repo_value(result.repo).owner { return 1; }
    if entries != entries { return 1; }
    return 0;
}

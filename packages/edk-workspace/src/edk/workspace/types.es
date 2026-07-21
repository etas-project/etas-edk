module edk.workspace.types;

public type WorkspaceRoot;
public type ReportsRoot;

public spec WorkspaceRegion;
public spec ReadablePath<R ~ WorkspaceRegion>;
public spec WritablePath<R ~ WorkspaceRegion>;
public spec ListablePath<R ~ WorkspaceRegion>;

impl WorkspaceRoot ~ WorkspaceRegion;
impl ReportsRoot ~ WorkspaceRegion;

public type WorkspacePath<R ~ WorkspaceRegion> = {
    value: string,
};

public alias WorkspaceRootPath = WorkspacePath<WorkspaceRoot>;
public alias ReportPath = WorkspacePath<ReportsRoot>;

impl WorkspaceRootPath ~ ReadablePath<WorkspaceRoot>;
impl WorkspaceRootPath ~ WritablePath<WorkspaceRoot>;
impl WorkspaceRootPath ~ ListablePath<WorkspaceRoot>;

impl ReportPath ~ ReadablePath<ReportsRoot>;
impl ReportPath ~ WritablePath<ReportsRoot>;
impl ReportPath ~ ListablePath<ReportsRoot>;

public alias PathScope = {
    pattern: string,
};

public alias Glob = {
    pattern: string,
};

public alias WorkspaceEntry = {
    path: WorkspaceRootPath,
    kind: string,
    size: i64,
};

public alias FileStat = {
    path: WorkspaceRootPath,
    exists: bool,
    kind: string,
    size: i64,
    modified_millis: i64,
};

public alias WriteMode = {
    create: bool,
    replace: bool,
    append: bool,
};

public alias AtomicWriteOptions = {
    mode: WriteMode,
    sync: bool,
};

public alias WorkspaceSnapshot = {
    entries: Array<WorkspaceEntry>,
};

public alias WorkspaceDiff = {
    added: Array<WorkspaceEntry>,
    removed: Array<WorkspaceEntry>,
    changed: Array<WorkspaceEntry>,
};

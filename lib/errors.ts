/** The git errors which can be parsed from failed git commands. */
export enum GitError {
  BadConfigValue,
  SSHKeyAuditUnverified,
  SSHAuthenticationFailed,
  SSHPermissionDenied,
  HTTPSAuthenticationFailed,
  RemoteDisconnection,
  HostDown,
  RebaseConflicts,
  MergeConflicts,
  HTTPSRepositoryNotFound,
  SSHRepositoryNotFound,
  PushNotFastForward,
  BranchDeletionFailed,
  DefaultBranchDeletionFailed,
  RevertConflicts,
  EmptyRebasePatch,
  NoMatchingRemoteBranch,
  NoExistingRemoteBranch,
  NothingToCommit,
  NoSubmoduleMapping,
  SubmoduleRepositoryDoesNotExist,
  InvalidSubmoduleSHA,
  LocalPermissionDenied,
  InvalidMerge,
  InvalidRebase,
  NonFastForwardMergeIntoEmptyHead,
  PatchDoesNotApply,
  BranchAlreadyExists,
  BadRevision,
  NotAGitRepository,
  CannotMergeUnrelatedHistories,
  LFSAttributeDoesNotMatch,
  BranchRenameFailed,
  PathDoesNotExist,
  InvalidObjectName,
  OutsideRepository,
  LockFileAlreadyExists,
  NoMergeToAbort,
  LocalChangesOverwritten,
  UnresolvedConflicts,
  GPGFailedToSignData,
  ConflictModifyDeletedInBranch,
  // Start of GitHub-specific error codes
  PushWithFileSizeExceedingLimit,
  HexBranchNameRejected,
  ForcePushRejected,
  InvalidRefLength,
  ProtectedBranchRequiresReview,
  ProtectedBranchForcePush,
  ProtectedBranchDeleteRejected,
  ProtectedBranchRequiredStatus,
  PushWithPrivateEmail,
  // End of GitHub-specific error codes
  ConfigLockFileAlreadyExists,
  RemoteAlreadyExists,
  TagAlreadyExists,
  MergeWithLocalChanges,
  RebaseWithLocalChanges,
  MergeCommitNoMainlineOption,
  UnsafeDirectory,
  PathExistsButNotInRef,
}

/** A mapping from regexes to the git error they identify. */
export const GitErrorRegexes: { [regexp: string]: GitError } = {
  "fatal: bad (?:numeric|boolean) config value '(.+)' for '(.+)'":
    GitError.BadConfigValue,
  'ERROR: ([\\s\\S]+?)\\n+\\[EPOLICYKEYAGE\\]\\n+fatal: Could not read from remote repository.':
    GitError.SSHKeyAuditUnverified,
  "fatal: Authentication failed for 'https?://":
    GitError.HTTPSAuthenticationFailed,
  'fatal: Authentication failed': GitError.SSHAuthenticationFailed,
  'fatal: Could not read from remote repository.': GitError.SSHPermissionDenied,
  'The requested URL returned error: 403': GitError.HTTPSAuthenticationFailed,
  'fatal: [Tt]he remote end hung up unexpectedly': GitError.RemoteDisconnection,
  "fatal: unable to access '(.+)': Failed to connect to (.+): Host is down":
    GitError.HostDown,
  "Cloning into '(.+)'...\nfatal: unable to access '(.+)': Could not resolve host: (.+)":
    GitError.HostDown,
  'Resolve all conflicts manually, mark them as resolved with':
    GitError.RebaseConflicts,
  '(Merge conflict|Automatic merge failed; fix conflicts and then commit the result)':
    GitError.MergeConflicts,
  "fatal: repository '(.+)' not found": GitError.HTTPSRepositoryNotFound,
  'ERROR: Repository not found': GitError.SSHRepositoryNotFound,
  "\\((non-fast-forward|fetch first)\\)\nerror: failed to push some refs to '.*'":
    GitError.PushNotFastForward,
  "error: unable to delete '(.+)': remote ref does not exist":
    GitError.BranchDeletionFailed,
  '\\[remote rejected\\] (.+) \\(deletion of the current branch prohibited\\)':
    GitError.DefaultBranchDeletionFailed,
  "error: could not revert .*\nhint: after resolving the conflicts, mark the corrected paths\nhint: with 'git add <paths>' or 'git rm <paths>'\nhint: and commit the result with 'git commit'":
    GitError.RevertConflicts,
  "Applying: .*\nNo changes - did you forget to use 'git add'\\?\nIf there is nothing left to stage, chances are that something else\n.*":
    GitError.EmptyRebasePatch,
  'There are no candidates for (rebasing|merging) among the refs that you just fetched.\nGenerally this means that you provided a wildcard refspec which had no\nmatches on the remote end.':
    GitError.NoMatchingRemoteBranch,
  "Your configuration specifies to merge with the ref '(.+)'\nfrom the remote, but no such ref was fetched.":
    GitError.NoExistingRemoteBranch,
  'nothing to commit': GitError.NothingToCommit,
  "[Nn]o submodule mapping found in .gitmodules for path '(.+)'":
    GitError.NoSubmoduleMapping,
  "fatal: repository '(.+)' does not exist\nfatal: clone of '.+' into submodule path '(.+)' failed":
    GitError.SubmoduleRepositoryDoesNotExist,
  "Fetched in submodule path '(.+)', but it did not contain (.+). Direct fetching of that commit failed.":
    GitError.InvalidSubmoduleSHA,
  "fatal: could not create work tree dir '(.+)'.*: Permission denied":
    GitError.LocalPermissionDenied,
  'merge: (.+) - not something we can merge': GitError.InvalidMerge,
  'invalid upstream (.+)': GitError.InvalidRebase,
  'fatal: Non-fast-forward commit does not make sense into an empty head':
    GitError.NonFastForwardMergeIntoEmptyHead,
  'error: (.+): (patch does not apply|already exists in working directory)':
    GitError.PatchDoesNotApply,
  "fatal: [Aa] branch named '(.+)' already exists.?":
    GitError.BranchAlreadyExists,
  "fatal: bad revision '(.*)'": GitError.BadRevision,
  'fatal: [Nn]ot a git repository \\(or any of the parent directories\\): (.*)':
    GitError.NotAGitRepository,
  'fatal: refusing to merge unrelated histories':
    GitError.CannotMergeUnrelatedHistories,
  'The .+ attribute should be .+ but is .+': GitError.LFSAttributeDoesNotMatch,
  'fatal: Branch rename failed': GitError.BranchRenameFailed,
  "fatal: path '(.+)' does not exist .+": GitError.PathDoesNotExist,
  "fatal: invalid object name '(.+)'.": GitError.InvalidObjectName,
  "fatal: .+: '(.+)' is outside repository": GitError.OutsideRepository,
  'Another git process seems to be running in this repository, e.g.':
    GitError.LockFileAlreadyExists,
  'fatal: There is no merge to abort': GitError.NoMergeToAbort,
  'error: (?:Your local changes to the following|The following untracked working tree) files would be overwritten by checkout:':
    GitError.LocalChangesOverwritten,
  'You must edit all merge conflicts and then\nmark them as resolved using git add|fatal: Exiting because of an unresolved conflict':
    GitError.UnresolvedConflicts,
  'error: gpg failed to sign the data': GitError.GPGFailedToSignData,
  'CONFLICT \\(modify/delete\\): (.+) deleted in (.+) and modified in (.+)':
    GitError.ConflictModifyDeletedInBranch,
  // GitHub-specific errors
  'error: GH001: ': GitError.PushWithFileSizeExceedingLimit,
  'error: GH002: ': GitError.HexBranchNameRejected,
  'error: GH003: Sorry, force-pushing to (.+) is not allowed.':
    GitError.ForcePushRejected,
  'error: GH005: Sorry, refs longer than (.+) bytes are not allowed':
    GitError.InvalidRefLength,
  'error: GH006: Protected branch update failed for (.+)\nremote: error: At least one approved review is required':
    GitError.ProtectedBranchRequiresReview,
  'error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot force-push to a protected branch':
    GitError.ProtectedBranchForcePush,
  'error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot delete a protected branch':
    GitError.ProtectedBranchDeleteRejected,
  'error: GH006: Protected branch update failed for (.+).\nremote: error: Required status check "(.+)" is expected':
    GitError.ProtectedBranchRequiredStatus,
  'error: GH007: Your push would publish a private email address.':
    GitError.PushWithPrivateEmail,
  'error: could not lock config file (.+): File exists':
    GitError.ConfigLockFileAlreadyExists,
  'error: remote (.+) already exists.': GitError.RemoteAlreadyExists,
  "fatal: tag '(.+)' already exists": GitError.TagAlreadyExists,
  'error: Your local changes to the following files would be overwritten by merge:\n':
    GitError.MergeWithLocalChanges,
  'error: cannot (pull with rebase|rebase): You have unstaged changes\\.\n\\s*error: [Pp]lease commit or stash them\\.':
    GitError.RebaseWithLocalChanges,
  'error: commit (.+) is a merge but no -m option was given':
    GitError.MergeCommitNoMainlineOption,
  'fatal: detected dubious ownership in repository at (.+)':
    GitError.UnsafeDirectory,
  "fatal: path '(.+)' exists on disk, but not in '(.+)'":
    GitError.PathExistsButNotInRef,
}

export class ExecError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string | undefined | null,
    public readonly stdout: Buffer | string,
    public readonly stderr: Buffer | string,
    cause?: unknown
  ) {
    super(message, { cause })
  }
}

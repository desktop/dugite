/** The git errors which can be parsed from failed git commands. */
export enum GitError {
  SSHKeyAuditUnverified = 'ssh-key-audit-unverified',
  SSHAuthenticationFailed = 'ssh-authentication-failed',
  SSHPermissionDenied = 'ssh-permission-denied',
  HTTPSAuthenticationFailed = 'https-authentication-failed',
  RemoteDisconnection = 'remote-disconnection',
  HostDown = 'host-down',
  RebaseConflicts = 'rebase-conflict',
  MergeConflicts = 'merge-conflicts',
  HTTPSRepositoryNotFound = 'https-repository-not-found',
  SSHRepositoryNotFound = 'ssh-repository-not-found',
  PushNotFastForward = 'push-not-fast-forward',
  BranchDeletionFailed = 'branch-deletion-failed',
  DefaultBranchDeletionFailed = 'default-branch-deletion-failed',
  RevertConflicts = 'revert-conflicts',
  EmptyRebasePatch = 'empty-rebase-patch',
  NoMatchingRemoteBranch = 'no-matching-remote-branch',
  NothingToCommit = 'nothing-to-commit',
  NoSubmoduleMapping = 'no-submodule-mapping',
  SubmoduleRepositoryDoesNotExist = 'submodule-repository-does-not-exist',
  InvalidSubmoduleSHA = 'invalid-submodule-sha',
  LocalPermissionDenied = 'local-permission-denied',
  InvalidMerge = 'invalid-merge',
  InvalidRebase = 'invalid-rebase',
  NonFastForwardMergeIntoEmptyHead = 'non-fast-forward-merge-into-empty-head',
  PatchDoesNotApply = 'patch-does-not-apply',
  BranchAlreadyExists = 'branch-already-exists',
  BadRevision = 'bad-revision',
  NotAGitRepository = 'not-a-git-repository',
  CannotMergeUnrelatedHistories = 'cannot-merge-unrelated-histories',
  LFSAttributeDoesNotMatch = 'lfs-attribute-does-not-match',
  BranchRenameFailed = 'branch-rename-failed',
  PathDoesNotExist = 'path-does-not-exist',
  InvalidObjectName = 'invalid-object-name',
  OutsideRepository = 'outside-repository',
  LockFileAlreadyExists = 'lock-file-already-exists',
  NoMergeToAbort = 'no-merge-to-abort',
  // GitHub-specific error codes
  PushWithFileSizeExceedingLimit = 'push-with-file-size-exceeding-limit',
  HexBranchNameRejected = 'hex-branch-name-rejected',
  ForcePushRejected = 'force-push-rejected',
  InvalidRefLength = 'invalid-ref-length',
  ProtectedBranchRequiresReview = 'protected-branch-requires-review',
  ProtectedBranchForcePush = 'protected-branch-force-push',
  ProtectedBranchDeleteRejected = 'protected-branch-delete-rejected',
  ProtectedBranchRequiredStatus = 'protected-branch-required-status',
  PushWithPrivateEmail = 'push-with-private-email'
}

/** A mapping from regexes to the git error they identify. */

export const GitErrorRegexes = new Map<RegExp, GitError>([
  [
    /ERROR: ([\s\S]+?)\n+\[EPOLICYKEYAGE\]\n+fatal: Could not read from remote repository./,
    GitError.SSHKeyAuditUnverified
  ],
  [/fatal: Authentication failed for 'https:\/\//, GitError.HTTPSAuthenticationFailed],
  [/fatal: Authentication failed/, GitError.SSHAuthenticationFailed],
  [/fatal: Could not read from remote repository./, GitError.SSHPermissionDenied],
  [/The requested URL returned error: 403/, GitError.HTTPSAuthenticationFailed],
  [/fatal: The remote end hung up unexpectedly/, GitError.RemoteDisconnection],
  [/fatal: unable to access '(.+)': Failed to connect to (.+): Host is down/, GitError.HostDown],
  [/Failed to merge in the changes./, GitError.RebaseConflicts],
  [
    /(Merge conflict|Automatic merge failed; fix conflicts and then commit the result)/,
    GitError.MergeConflicts
  ],
  [/fatal: repository '(.+)' not found/, GitError.HTTPSRepositoryNotFound],
  [/ERROR: Repository not found/, GitError.SSHRepositoryNotFound],
  [
    /\((non-fast-forward|fetch first)\)\nerror: failed to push some refs to '.*'/,
    GitError.PushNotFastForward
  ],
  [/error: unable to delete '(.+)': remote ref does not exist/, GitError.BranchDeletionFailed],
  [
    /\[remote rejected\] (.+) \(deletion of the current branch prohibited\)/,
    GitError.DefaultBranchDeletionFailed
  ],
  [/error: Reverting is not possible because you have unmerged files./, GitError.RevertConflicts],
  [
    /Applying: .*\nNo changes - did you forget to use 'git add'\?\nIf there is nothing left to stage, chances are that something else\n.*/,
    GitError.EmptyRebasePatch
  ],
  [
    /There are no candidates for (rebasing|merging) among the refs that you just fetched.\nGenerally this means that you provided a wildcard refspec which had no\nmatches on the remote end./,
    GitError.NoMatchingRemoteBranch
  ],
  [/nothing to commit/, GitError.NothingToCommit],
  [/No submodule mapping found in .gitmodules for path '(.+)'/, GitError.NoSubmoduleMapping],
  [
    /fatal: repository '(.+)' does not exist\nfatal: clone of '.+' into submodule path '(.+)' failed/,
    GitError.SubmoduleRepositoryDoesNotExist
  ],
  [
    /Fetched in submodule path '(.+)', but it did not contain (.+). Direct fetching of that commit failed./,
    GitError.InvalidSubmoduleSHA
  ],
  [
    /fatal: could not create work tree dir '(.+)'.*: Permission denied/,
    GitError.LocalPermissionDenied
  ],
  [/merge: (.+) - not something we can merge/, GitError.InvalidMerge],
  [/invalid upstream (.+)/, GitError.InvalidRebase],
  [
    /fatal: Non-fast-forward commit does not make sense into an empty head/,
    GitError.NonFastForwardMergeIntoEmptyHead
  ],
  [
    /error: (.+): (patch does not apply|already exists in working directory)/,
    GitError.PatchDoesNotApply
  ],
  [/fatal: A branch named '(.+)' already exists./, GitError.BranchAlreadyExists],
  [/fatal: bad revision '(.*)'/, GitError.BadRevision],
  [
    /fatal: [Nn]ot a git repository \(or any of the parent directories\): (.*)/,
    GitError.NotAGitRepository
  ],
  [/fatal: refusing to merge unrelated histories/, GitError.CannotMergeUnrelatedHistories],
  [/The .+ attribute should be .+ but is .+/, GitError.LFSAttributeDoesNotMatch],
  [/fatal: Branch rename failed/, GitError.BranchRenameFailed],
  [/fatal: Path '(.+)' does not exist .+/, GitError.PathDoesNotExist],
  [/fatal: Invalid object name '(.+)'./, GitError.InvalidObjectName],
  [/fatal: .+: '(.+)' is outside repository/, GitError.OutsideRepository],
  [
    /Another git process seems to be running in this repository, e.g./,
    GitError.LockFileAlreadyExists
  ],
  [/fatal: There is no merge to abort/, GitError.NoMergeToAbort],
  [/error: GH001: /, GitError.PushWithFileSizeExceedingLimit],
  [/error: GH002: /, GitError.HexBranchNameRejected],
  [/error: GH003: Sorry, force-pushing to (.+) is not allowed./, GitError.ForcePushRejected],
  [/error: GH005: Sorry, refs longer than (.+) bytes are not allowed/, GitError.InvalidRefLength],
  [
    /error: GH006: Protected branch update failed for (.+)\nremote: error: At least one approved review is required/,
    GitError.ProtectedBranchRequiresReview
  ],
  [
    /error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot force-push to a protected branch/,
    GitError.ProtectedBranchForcePush
  ],
  [
    /error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot delete a protected branch/,
    GitError.ProtectedBranchDeleteRejected
  ],
  [
    /error: GH006: Protected branch update failed for (.+).\nremote: error: Required status check "(.+)" is expected/,
    GitError.ProtectedBranchRequiredStatus
  ],
  [/error: GH007: Your push would publish a private email address./, GitError.PushWithPrivateEmail]
])

/**
 * The error code for when git cannot be found. This most likely indicates a
 * problem with dugite itself.
 */
export const GitNotFoundErrorCode = 'git-not-found-error'

/** The error code for when the path to a repository doesn't exist. */
export const RepositoryDoesNotExistErrorCode = 'repository-does-not-exist-error'

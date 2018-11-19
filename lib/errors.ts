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
    new RegExp(
      'ERROR: ([\\s\\S]+?)\\n+\\[EPOLICYKEYAGE\\]\\n+fatal: Could not read from remote repository.'
    ),
    GitError.SSHKeyAuditUnverified
  ],
  [new RegExp("fatal: Authentication failed for 'https://"), GitError.HTTPSAuthenticationFailed],
  [new RegExp('fatal: Authentication failed'), GitError.SSHAuthenticationFailed],
  [new RegExp('fatal: Could not read from remote repository.'), GitError.SSHPermissionDenied],
  [new RegExp('The requested URL returned error: 403'), GitError.HTTPSAuthenticationFailed],
  [new RegExp('fatal: The remote end hung up unexpectedly'), GitError.RemoteDisconnection],
  [
    new RegExp("fatal: unable to access '(.+)': Failed to connect to (.+): Host is down"),
    GitError.HostDown
  ],
  [new RegExp('Failed to merge in the changes.'), GitError.RebaseConflicts],
  [
    new RegExp('(Merge conflict|Automatic merge failed; fix conflicts and then commit the result)'),
    GitError.MergeConflicts
  ],
  [new RegExp("fatal: repository '(.+)' not found"), GitError.HTTPSRepositoryNotFound],
  [new RegExp('ERROR: Repository not found'), GitError.SSHRepositoryNotFound],
  [
    new RegExp("\\((non-fast-forward|fetch first)\\)\nerror: failed to push some refs to '.*'"),
    GitError.PushNotFastForward
  ],
  [
    new RegExp("error: unable to delete '(.+)': remote ref does not exist"),
    GitError.BranchDeletionFailed
  ],
  [
    new RegExp('\\[remote rejected\\] (.+) \\(deletion of the current branch prohibited\\)'),
    GitError.DefaultBranchDeletionFailed
  ],
  [
    new RegExp(
      "error: could not revert .*\nhint: after resolving the conflicts, mark the corrected paths\nhint: with 'git add <paths>' or 'git rm <paths>'\nhint: and commit the result with 'git commit'"
    ),
    GitError.RevertConflicts
  ],
  [
    new RegExp(
      "Applying: .*\nNo changes - did you forget to use 'git add'\\?\nIf there is nothing left to stage, chances are that something else\n.*"
    ),
    GitError.EmptyRebasePatch
  ],
  [
    new RegExp(
      'There are no candidates for (rebasing|merging) among the refs that you just fetched.\nGenerally this means that you provided a wildcard refspec which had no\nmatches on the remote end.'
    ),
    GitError.NoMatchingRemoteBranch
  ],
  [new RegExp('nothing to commit'), GitError.NothingToCommit],
  [
    new RegExp("No submodule mapping found in .gitmodules for path '(.+)'"),
    GitError.NoSubmoduleMapping
  ],
  [
    new RegExp(
      "fatal: repository '(.+)' does not exist\nfatal: clone of '.+' into submodule path '(.+)' failed"
    ),
    GitError.SubmoduleRepositoryDoesNotExist
  ],
  [
    new RegExp(
      "Fetched in submodule path '(.+)', but it did not contain (.+). Direct fetching of that commit failed."
    ),
    GitError.InvalidSubmoduleSHA
  ],
  [
    new RegExp("fatal: could not create work tree dir '(.+)'.*: Permission denied"),
    GitError.LocalPermissionDenied
  ],
  [new RegExp('merge: (.+) - not something we can merge'), GitError.InvalidMerge],
  [new RegExp('invalid upstream (.+)'), GitError.InvalidRebase],
  [
    new RegExp('fatal: Non-fast-forward commit does not make sense into an empty head'),
    GitError.NonFastForwardMergeIntoEmptyHead
  ],
  [
    new RegExp('error: (.+): (patch does not apply|already exists in working directory)'),
    GitError.PatchDoesNotApply
  ],
  [new RegExp("fatal: A branch named '(.+)' already exists."), GitError.BranchAlreadyExists],
  [new RegExp("fatal: bad revision '(.*)'"), GitError.BadRevision],
  [
    new RegExp('fatal: [Nn]ot a git repository \\(or any of the parent directories\\): (.*)'),
    GitError.NotAGitRepository
  ],
  [
    new RegExp('fatal: refusing to merge unrelated histories'),
    GitError.CannotMergeUnrelatedHistories
  ],
  [new RegExp('The .+ attribute should be .+ but is .+'), GitError.LFSAttributeDoesNotMatch],
  [new RegExp('fatal: Branch rename failed'), GitError.BranchRenameFailed],
  [new RegExp("fatal: Path '(.+)' does not exist .+"), GitError.PathDoesNotExist],
  [new RegExp("fatal: Invalid object name '(.+)'."), GitError.InvalidObjectName],
  [new RegExp("fatal: .+: '(.+)' is outside repository"), GitError.OutsideRepository],
  [
    new RegExp('Another git process seems to be running in this repository, e.g.'),
    GitError.LockFileAlreadyExists
  ],
  [new RegExp('fatal: There is no merge to abort'), GitError.NoMergeToAbort],
  // GitHub-specific errors
  [new RegExp('error: GH001: '), GitError.PushWithFileSizeExceedingLimit],
  [new RegExp('error: GH002: '), GitError.HexBranchNameRejected],
  [
    new RegExp('error: GH003: Sorry, force-pushing to (.+) is not allowed.'),
    GitError.ForcePushRejected
  ],
  [
    new RegExp('error: GH005: Sorry, refs longer than (.+) bytes are not allowed'),
    GitError.InvalidRefLength
  ],
  [
    new RegExp(
      'error: GH006: Protected branch update failed for (.+)\nremote: error: At least one approved review is required'
    ),
    GitError.ProtectedBranchRequiresReview
  ],
  [
    new RegExp(
      'error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot force-push to a protected branch'
    ),
    GitError.ProtectedBranchForcePush
  ],
  [
    new RegExp(
      'error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot delete a protected branch'
    ),
    GitError.ProtectedBranchDeleteRejected
  ],
  [
    new RegExp(
      'error: GH006: Protected branch update failed for (.+).\nremote: error: Required status check "(.+)" is expected'
    ),
    GitError.ProtectedBranchRequiredStatus
  ],
  [
    new RegExp('error: GH007: Your push would publish a private email address.'),
    GitError.PushWithPrivateEmail
  ]
])

/**
 * The error code for when git cannot be found. This most likely indicates a
 * problem with dugite itself.
 */
export const GitNotFoundErrorCode = 'git-not-found-error'

/** The error code for when the path to a repository doesn't exist. */
export const RepositoryDoesNotExistErrorCode = 'repository-does-not-exist-error'

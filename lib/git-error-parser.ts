export enum GitErrorKey {
  SSHKeyAuditUnverified = 'ssh-key-audit-unverified',
  SSHAuthenticationFailed = 'ssh-authentication-failed',
  SSHPermissionDenied = 'ssh-permission-denied',
  HTTPSAuthenticationFailed = 'https-authentication-failed',
  RemoteDisconnection = 'remote-disconnection',
  HostDown = 'host-down',
  RebaseConflicts = 'rebase-conflicts',
  MergeConflicts = 'merge-conflicts',
  HTTPSRepositoryNotFound = 'https-repository-not-found',
  SSHRepositoryNotFound = 'ssh-repository-not-found',
  PushNotFastForward = 'push-not-fast-forward',
  BranchDeletionFailed = 'branch-deletion-failed',
  DefaultBranchDeletionFailed = 'default-branch-deletion-failed',
  RevertConflicts = 'revert-conflicts',
  EmptyRebasePatch = 'empty-rebase-branch',
  NoMatchingRemoteBranch = 'no-matching-remote-branch',
  NothingToCommit = 'nothing-to-commit',
  NoSubmoduleMapping = 'no-submodule-mapping',
  SubmoduleRepositoryDoesNotExist = 'submodule-repository-does-not-exist',
  InvalidSubmoduleSHA = 'invalid-submodule-sha',
  LocalPermissionDenied = 'local-permission-denied',
  InvalidMerge = 'invalid-merge',
  InvalidRebase = 'invalid-rebase',
  NonFastForwardMergeIntoEmptyHead = 'non-fast-forward-merge-into-empty-HEAD',
  PatchDoesNotApply = 'patch-does-not-apply',
  BranchAlreadyExists = 'branch-already-exists',
  BadRevision = 'bad-revision',
  NotAGitRepository = 'not-a-git-repository',
  CannotMergeUnrelatedHistories = 'cannot-merge-unrelated-histories',
  LFSAttributeDoesNotMatch = 'lfs-attribute-does-not-match',
  // GitHub-specific error codes
  PushWithFileSizeExceedingLimit = 'push-with-file-size-exceeding-limit',
  HexBranchNameRejected = 'hex-branch-name-rejected',
  ForcePushRejected = 'force-push-rejected',
  InvalidRefLength = 'invalid-ref-length',
  ProtectedBranchRequiresReview = 'protected-branch-requires-review',
  ProtectedBranchForcePush = 'protected-branch-force-push',
  ProtectedBranchDeleteRejected = 'protected-branch-delete-required',
  ProtectedBranchRequiredStatus = 'protected-branch-required-status',
  PushWithPrivateEmail = 'push-with-private-email'
}

type GitError = {
  key: GitErrorKey
  regexp: RegExp
  captureKeys?: Array<string>
}

const GitErrorLookups: Array<GitError> = [
  {
    key: GitErrorKey.SSHKeyAuditUnverified,
    regexp: /ERROR: ([\\s\\S]+?)\\n+\\[EPOLICYKEYAGE\\]\\n+fatal: Could not read from remote repository./
  },
  {
    key: GitErrorKey.HTTPSAuthenticationFailed,
    // TODO: can we get the host information out of this error?
    regexp: /fatal: Authentication failed for 'https:\/\//
  },
  {
    key: GitErrorKey.SSHAuthenticationFailed,
    // TODO: can we get the host information out of this error?
    regexp: /fatal: Authentication failed/
  },
  {
    key: GitErrorKey.SSHPermissionDenied,
    // TODO: can we get the host information out of this error?
    regexp: /fatal: Could not read from remote repository./
  },
  {
    key: GitErrorKey.HTTPSAuthenticationFailed,
    // TODO: can we get the host information out of this error?
    regexp: /The requested URL returned error: 403/
  },
  {
    key: GitErrorKey.RemoteDisconnection,
    // TODO: can we get the host information out of this error?
    regexp: /fatal: The remote end hung up unexpectedly/
  },
  {
    key: GitErrorKey.HostDown,
    // TODO: can we get the host information out of this error?
    regexp: /fatal: unable to access '(.+)': Failed to connect to (.+): Host is down/
  },
  {
    key: GitErrorKey.RebaseConflicts,
    // TODO: can we get the host information out of this error?
    regexp: /Failed to merge in the changes./
  },
  {
    key: GitErrorKey.MergeConflicts,
    // TODO: can we get the host information out of this error?
    regexp: /(Merge conflict|Automatic merge failed; fix conflicts and then commit the result)/
  },
  {
    key: GitErrorKey.HTTPSRepositoryNotFound,
    regexp: /fatal: repository '(.+)' not found/
  },
  {
    key: GitErrorKey.SSHRepositoryNotFound,
    regexp: /ERROR: Repository not found/
  },
  {
    key: GitErrorKey.PushNotFastForward,
    regexp: /\\((non-fast-forward|fetch first)\\)\nerror: failed to push some refs to '.*'/
  },
  {
    key: GitErrorKey.BranchDeletionFailed,
    regexp: /error: unable to delete '(.+)': remote ref does not exist/
  },
  {
    key: GitErrorKey.DefaultBranchDeletionFailed,
    regexp: /\\[remote rejected\\] (.+) \\(deletion of the current branch prohibited\\)/
  },
  {
    key: GitErrorKey.RevertConflicts,
    regexp: /error: could not revert .*\nhint: after resolving the conflicts, mark the corrected paths\nhint: with 'git add <paths>' or 'git rm <paths>'\nhint: and commit the result with 'git commit'/
  },
  {
    key: GitErrorKey.EmptyRebasePatch,
    regexp: /Applying: .*\nNo changes - did you forget to use 'git add'\\?\nIf there is nothing left to stage, chances are that something else\n.*/
  },
  {
    key: GitErrorKey.NoMatchingRemoteBranch,
    regexp: /There are no candidates for (rebasing|merging) among the refs that you just fetched.\nGenerally this means that you provided a wildcard refspec which had no\nmatches on the remote end./
  },
  {
    key: GitErrorKey.NothingToCommit,
    regexp: /nothing to commit/
  },
  {
    key: GitErrorKey.NoSubmoduleMapping,
    regexp: /No submodule mapping found in .gitmodules for path '(.+)'/
  },
  {
    key: GitErrorKey.SubmoduleRepositoryDoesNotExist,
    regexp: /fatal: repository '(.+)' does not exist\nfatal: clone of '.+' into submodule path '(.+)' failed/
  },
  {
    key: GitErrorKey.InvalidSubmoduleSHA,
    regexp: /Fetched in submodule path '(.+)', but it did not contain (.+). Direct fetching of that commit failed./
  },
  {
    key: GitErrorKey.LocalPermissionDenied,
    regexp: /fatal: could not create work tree dir '(.+)'.*: Permission denied/
  },
  {
    key: GitErrorKey.InvalidMerge,
    regexp: /merge: (.+) - not something we can merge/
  },
  {
    key: GitErrorKey.InvalidRebase,
    regexp: /invalid upstream (.+)/
  },
  {
    key: GitErrorKey.NonFastForwardMergeIntoEmptyHead,
    regexp: /fatal: Non-fast-forward commit does not make sense into an empty head/
  },
  {
    key: GitErrorKey.PatchDoesNotApply,
    regexp: /error: (.+): (patch does not apply|already exists in working directory)/
  },
  {
    key: GitErrorKey.BranchAlreadyExists,
    regexp: /fatal: A branch named '(.+)' already exists./
  },
  {
    key: GitErrorKey.BadRevision,
    regexp: /fatal: bad revision '(.*)'/
  },
  {
    key: GitErrorKey.NotAGitRepository,
    regexp: /fatal: Not a git repository \\(or any of the parent directories\\): (.*)/
  },
  {
    key: GitErrorKey.CannotMergeUnrelatedHistories,
    regexp: /fatal: refusing to merge unrelated histories/
  },
  {
    key: GitErrorKey.LFSAttributeDoesNotMatch,
    regexp: /The .+ attribute should be .+ but is .+/
  },
  {
    key: GitErrorKey.PushWithFileSizeExceedingLimit,
    regexp: /error: GH001: /
  },
  {
    key: GitErrorKey.HexBranchNameRejected,
    regexp: /error: GH002: /
  },
  {
    key: GitErrorKey.ForcePushRejected,
    regexp: /error: GH003: Sorry, force-pushing to (.+) is not allowed./
  },
  {
    key: GitErrorKey.InvalidRefLength,
    regexp: /error: GH005: Sorry, refs longer than (.+) bytes are not allowed/
  },
  {
    key: GitErrorKey.ProtectedBranchRequiresReview,
    regexp: /error: GH006: Protected branch update failed for (.+)\nremote: error: At least one approved review is required/
  },
  {
    key: GitErrorKey.ProtectedBranchRequiresReview,
    regexp: /error: GH006: Protected branch update failed for (.+)\nremote: error: At least one approved review is required/
  },
  {
    key: GitErrorKey.ProtectedBranchForcePush,
    regexp: /error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot force-push to a protected branch/
  },
  {
    key: GitErrorKey.ProtectedBranchDeleteRejected,
    regexp: /error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot delete a protected branch/
  },
  {
    key: GitErrorKey.ProtectedBranchRequiredStatus,
    regexp: /error: GH006: Protected branch update failed for (.+).\nremote: error: Required status check "(.+)" is expected/
  },
  {
    key: GitErrorKey.PushWithPrivateEmail,
    regexp: /error: GH007: Your push would publish a private email address./
  }
]

export type NewGitError = {
  readonly kind: GitErrorKey
}

export function parseError(stderr: string): GitErrorKey | null {
  for (const [_, lookup] of GitErrorLookups.entries()) {
    if (stderr.match(lookup.regexp)) return lookup.key
  }

  return null
}

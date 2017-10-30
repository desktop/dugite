export enum GitError {
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

export type CommonErrorKey =
  | GitError.HTTPSAuthenticationFailed
  | GitError.HTTPSRepositoryNotFound
  | GitError.SSHKeyAuditUnverified
  | GitError.SSHAuthenticationFailed
  | GitError.SSHPermissionDenied
  | GitError.SSHRepositoryNotFound
  | GitError.RemoteDisconnection
  | GitError.HostDown
  | GitError.RebaseConflicts
  | GitError.EmptyRebasePatch
  | GitError.MergeConflicts
  | GitError.RevertConflicts
  | GitError.PushNotFastForward
  | GitError.BranchDeletionFailed
  | GitError.DefaultBranchDeletionFailed
  | GitError.ForcePushRejected
  | GitError.NoMatchingRemoteBranch
  | GitError.NothingToCommit
  | GitError.NoSubmoduleMapping
  | GitError.SubmoduleRepositoryDoesNotExist
  | GitError.InvalidSubmoduleSHA
  | GitError.LocalPermissionDenied
  | GitError.InvalidRebase
  | GitError.InvalidMerge
  | GitError.InvalidRefLength
  | GitError.BadRevision
  | GitError.NotAGitRepository
  | GitError.CannotMergeUnrelatedHistories
  | GitError.NonFastForwardMergeIntoEmptyHead
  | GitError.PatchDoesNotApply
  | GitError.ProtectedBranchRequiresReview
  | GitError.PushWithPrivateEmail
  | GitError.LFSAttributeDoesNotMatch
  | GitError.PushWithFileSizeExceedingLimit
  | GitError.HexBranchNameRejected

export type CommonError = {
  kind: CommonErrorKey
}

export type ProtectedBranchRequiredStatusError = {
  kind: GitError.ProtectedBranchRequiredStatus
  status: string
}

export type BranchAlreadyExistsError = {
  kind: GitError.BranchAlreadyExists
  existingBranch: string
}

export type ProtectedBranchDeleteError = {
  kind: GitError.ProtectedBranchDeleteRejected
  ref: string
}

export type ProtectedBranchForcePushError = {
  kind: GitError.ProtectedBranchForcePush
  ref: string
}

export type GitErrorDetails =
  | CommonError
  | ProtectedBranchRequiredStatusError
  | ProtectedBranchDeleteError
  | ProtectedBranchForcePushError
  | BranchAlreadyExistsError

type GitError = {
  readonly regexp: RegExp
  readonly create: (match: RegExpMatchArray) => GitErrorDetails
}

const GitErrorLookups: Array<GitError> = [
  {
    regexp: /ERROR: ([\\s\\S]+?)\\n+\\[EPOLICYKEYAGE\\]\\n+fatal: Could not read from remote repository./,
    create: () => {
      return {
        kind: GitError.SSHKeyAuditUnverified
      }
    }
  },
  {
    regexp: /fatal: Authentication failed for 'https:\/\//,
    create: () => {
      return { kind: GitError.HTTPSAuthenticationFailed }
    }
  },
  {
    regexp: /fatal: Authentication failed/,
    create: () => {
      return { kind: GitError.SSHAuthenticationFailed }
    }
  },
  {
    regexp: /fatal: Could not read from remote repository./,
    create: () => {
      return { kind: GitError.SSHPermissionDenied }
    }
  },
  {
    regexp: /The requested URL returned error: 403/,
    create: () => {
      return { kind: GitError.HTTPSAuthenticationFailed }
    }
  },
  {
    regexp: /fatal: The remote end hung up unexpectedly/,
    create: () => {
      return {
        kind: GitError.RemoteDisconnection
      }
    }
  },
  {
    regexp: /fatal: unable to access '(.+)': Failed to connect to (.+): Host is down/,
    create: () => {
      return {
        kind: GitError.HostDown
      }
    }
  },
  {
    regexp: /Failed to merge in the changes./,
    create: () => {
      return { kind: GitError.RebaseConflicts }
    }
  },
  {
    regexp: /(Merge conflict|Automatic merge failed; fix conflicts and then commit the result)/,
    create: () => {
      return {
        kind: GitError.MergeConflicts
      }
    }
  },
  {
    regexp: /fatal: repository '(.+)' not found/,
    create: () => {
      return {
        kind: GitError.HTTPSRepositoryNotFound
      }
    }
  },
  {
    regexp: /ERROR: Repository not found/,
    create: () => {
      return {
        kind: GitError.SSHRepositoryNotFound
      }
    }
  },
  {
    regexp: /\\((non-fast-forward|fetch first)\\)\nerror: failed to push some refs to '.*'/,
    create: () => {
      return {
        kind: GitError.PushNotFastForward
      }
    }
  },
  {
    regexp: /error: unable to delete '(.+)': remote ref does not exist/,
    create: () => {
      return {
        kind: GitError.BranchDeletionFailed
      }
    }
  },
  {
    regexp: /\\[remote rejected\\] (.+) \\(deletion of the current branch prohibited\\)/,
    create: () => {
      return {
        kind: GitError.DefaultBranchDeletionFailed
      }
    }
  },
  {
    regexp: /error: could not revert .*\nhint: after resolving the conflicts, mark the corrected paths\nhint: with 'git add <paths>' or 'git rm <paths>'\nhint: and commit the result with 'git commit'/,
    create: () => {
      return {
        kind: GitError.RevertConflicts
      }
    }
  },
  {
    regexp: /Applying: .*\nNo changes - did you forget to use 'git add'\\?\nIf there is nothing left to stage, chances are that something else\n.*/,
    create: () => {
      return {
        kind: GitError.EmptyRebasePatch
      }
    }
  },
  {
    regexp: /There are no candidates for (rebasing|merging) among the refs that you just fetched.\nGenerally this means that you provided a wildcard refspec which had no\nmatches on the remote end./,
    create: () => {
      return {
        kind: GitError.NoMatchingRemoteBranch
      }
    }
  },
  {
    regexp: /nothing to commit/,
    create: () => {
      return {
        kind: GitError.NothingToCommit
      }
    }
  },
  {
    regexp: /No submodule mapping found in .gitmodules for path '(.+)'/,
    create: () => {
      return {
        kind: GitError.NoSubmoduleMapping
      }
    }
  },
  {
    regexp: /fatal: repository '(.+)' does not exist\nfatal: clone of '.+' into submodule path '(.+)' failed/,
    create: () => {
      return {
        kind: GitError.SubmoduleRepositoryDoesNotExist
      }
    }
  },
  {
    regexp: /Fetched in submodule path '(.+)', but it did not contain (.+). Direct fetching of that commit failed./,
    create: () => {
      return {
        kind: GitError.InvalidSubmoduleSHA
      }
    }
  },
  {
    regexp: /fatal: could not create work tree dir '(.+)'.*: Permission denied/,
    create: () => {
      return {
        kind: GitError.LocalPermissionDenied
      }
    }
  },
  {
    regexp: /merge: (.+) - not something we can merge/,
    create: () => {
      return {
        kind: GitError.InvalidMerge
      }
    }
  },
  {
    regexp: /invalid upstream (.+)/,
    create: () => {
      return {
        kind: GitError.InvalidRebase
      }
    }
  },
  {
    regexp: /fatal: Non-fast-forward commit does not make sense into an empty head/,
    create: () => {
      return {
        kind: GitError.NonFastForwardMergeIntoEmptyHead
      }
    }
  },
  {
    regexp: /error: (.+): (patch does not apply|already exists in working directory)/,
    create: () => {
      return {
        kind: GitError.PatchDoesNotApply
      }
    }
  },
  {
    regexp: /fatal: A branch named '(.+)' already exists./,
    create: (matches: RegExpMatchArray) => {
      return {
        kind: GitError.BranchAlreadyExists,
        existingBranch: matches[2]
      }
    }
  },
  {
    regexp: /fatal: bad revision '(.*)'/,
    create: () => {
      return {
        kind: GitError.BadRevision
      }
    }
  },
  {
    regexp: /fatal: Not a git repository \\(or any of the parent directories\\): (.*)/,
    create: () => {
      return {
        kind: GitError.NotAGitRepository
      }
    }
  },
  {
    regexp: /fatal: refusing to merge unrelated histories/,
    create: () => {
      return {
        kind: GitError.CannotMergeUnrelatedHistories
      }
    }
  },
  {
    regexp: /The .+ attribute should be .+ but is .+/,
    create: () => {
      return {
        kind: GitError.LFSAttributeDoesNotMatch
      }
    }
  },
  {
    regexp: /error: GH001: /,
    create: () => {
      return {
        kind: GitError.PushWithFileSizeExceedingLimit
      }
    }
  },
  {
    regexp: /error: GH002: /,
    create: () => {
      return {
        kind: GitError.HexBranchNameRejected
      }
    }
  },
  {
    regexp: /error: GH003: Sorry, force-pushing to (.+) is not allowed./,
    create: () => {
      return {
        kind: GitError.ForcePushRejected
      }
    }
  },
  {
    regexp: /error: GH005: Sorry, refs longer than (.+) bytes are not allowed/,
    create: () => {
      return {
        kind: GitError.InvalidRefLength
      }
    }
  },
  {
    regexp: /error: GH006: Protected branch update failed for (.+)\nremote: error: At least one approved review is required/,
    create: () => {
      return {
        kind: GitError.ProtectedBranchRequiresReview
      }
    }
  },
  {
    regexp: /error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot force-push to a protected branch/,
    create: matches => {
      return {
        kind: GitError.ProtectedBranchForcePush,
        ref: matches[1].replace('.', '')
      }
    }
  },
  {
    regexp: /error: GH006: Protected branch update failed for (.+)\nremote: error: Cannot delete a protected branch/,
    create: matches => {
      return {
        kind: GitError.ProtectedBranchDeleteRejected,
        ref: matches[1].replace('.', '')
      }
    }
  },
  {
    regexp: /error: GH006: Protected branch update failed for (.+).\nremote: error: Required status check "(.+)" is expected/,
    create: matches => {
      return {
        kind: GitError.ProtectedBranchRequiredStatus,
        status: matches[2]
      }
    }
  },
  {
    regexp: /error: GH007: Your push would publish a private email address./,
    create: () => {
      return {
        kind: GitError.PushWithPrivateEmail
      }
    }
  }
]

export function parseError(stderr: string): GitErrorDetails | null {
  for (const [_, lookup] of GitErrorLookups.entries()) {
    const match = stderr.match(lookup.regexp)
    if (match) {
      const error = lookup.create(match)
      return error
    }
  }

  return null
}

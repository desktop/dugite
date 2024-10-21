import { GitErrorRegexes } from './errors'

/** Try to parse an error type from stderr. */
export const parseError = (stderr: string) =>
  Object.entries(GitErrorRegexes).find(([re]) => stderr.match(re))?.[1] ?? null

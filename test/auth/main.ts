
/** Parse the GIT_ASKPASS prompt and determine the appropriate response. */
export function responseForPrompt(prompt: string): string | null {
  const username: string | null = process.env.TEST_USERNAME
  if (!username || !username.length) { return null }

  if (prompt.startsWith('Username')) {
    return username
  }

  const password: string | null = process.env.TEST_PASSWORD
  if (!password || !password.length) { return null }

  if (prompt.startsWith('Password')) {
    return password
  }

  return null
}

console.log(`args: ${JSON.stringify(process.argv)}`)
console.log(`env: ${JSON.stringify(process.env)}`)

const prompt = process.argv[2]
const response = responseForPrompt(prompt)
if (response) {
  process.stdout.write(response)
  // HACK: do we have a terminal here (and thus shouldn't end stdout eagerly?)
  const stdout = process.stdout as any
  if (!stdout.isTTY) {
    process.stdout.end()
  }
}

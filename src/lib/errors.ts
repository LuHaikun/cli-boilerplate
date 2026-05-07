/** Error type used for expected CLI failures that should not print stack traces. */
export interface CliError extends Error {
  readonly exitCode: number
}

/** Creates a predictable CLI error with a process exit code. */
export function createCliError(message: string, exitCode = 1): CliError {
  const error = new Error(message) as CliError

  Object.defineProperty(error, 'exitCode', {
    value: exitCode,
    enumerable: true,
  })

  return error
}

/** Returns true when an unknown error follows the CLI error contract. */
export function isCliError(error: unknown): error is CliError {
  return error instanceof Error && 'exitCode' in error
}

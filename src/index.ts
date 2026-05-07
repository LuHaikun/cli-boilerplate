import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command, CommanderError, Help } from 'commander'
import { registerMktplCommand } from './commands/mktpl'
import { isCliError } from './lib/errors'
import log from './lib/log'

const rootHelpExamples = `examples:

  $ mktpl <templateName> [dirPath]
  $ oh-my-cli mktpl Login ./src/views`

interface PackageJson {
  readonly version: string
  readonly description?: string
}

function readPackageJson(): PackageJson {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const packagePath = resolve(currentDir, '../package.json')

  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJson
}

/** Creates the root commander program without parsing argv, making command wiring testable. */
export function createProgram(): Command {
  const pkg = readPackageJson()
  const program = new Command()
  const defaultHelp = new Help()

  program
    .name('oh-my-cli')
    .description(pkg.description ?? 'TypeScript CLI boilerplate')
    .version(pkg.version)
    .showHelpAfterError()
    .showSuggestionAfterError()
    .exitOverride()
    .configureHelp({
      formatHelp(command, helper) {
        // Keep Commander-owned help formatting while appending root examples to helpInformation().
        return `${defaultHelp.formatHelp(command, helper)}\n${rootHelpExamples}\n`
      },
    })

  registerMktplCommand(program)

  return program
}

/** Parses argv and returns an exit code instead of terminating during tests. */
export async function runCli(argv = process.argv): Promise<number> {
  const program = createProgram()

  try {
    await program.parseAsync(argv)
    return 0
  } catch (error: unknown) {
    if (error instanceof CommanderError && Number.isInteger(error.exitCode)) return error.exitCode

    if (isCliError(error)) {
      log.error(error.message)
      return error.exitCode
    }

    throw error
  }
}

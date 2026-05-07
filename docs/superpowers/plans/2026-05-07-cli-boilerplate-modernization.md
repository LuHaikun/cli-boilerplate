# CLI Boilerplate Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the project into a reliable, testable TypeScript CLI boilerplate that generates pure CLI engineering modules instead of React or style files.

**Architecture:** Keep `bin/index.ts` as the executable entry, expose `runCli(argv)` from `src/index.ts`, move template generation into a testable service, and keep command registration thin. Build as ESM to produce `dist/index.js`, matching `package.json#bin`.

**Tech Stack:** Node.js 18+, TypeScript, tsup, commander, chalk, fs-extra, Vitest, tsx, Yarn v1.

---

## File Structure

- Modify `package.json`: align scripts, bin/main, dependencies, package metadata, and `lint-staged`.
- Modify `tsup.config.ts`: output ESM `dist/index.js` and preserve executable shebang.
- Modify `tsconfig.json`: keep strict TypeScript, include tests, and keep path aliases.
- Modify `bin/index.ts`: call `runCli(process.argv)` and handle rejected promises.
- Rewrite `src/index.ts`: expose `runCli`, create the commander program, register commands, and centralize exit handling.
- Rewrite `src/commands/mktpl/index.ts`: register `mktpl` and pass parsed options into the service.
- Create `src/commands/mktpl/types.ts`: define command option interfaces.
- Create `src/services/template-generator/index.ts`: validate names, resolve paths, compute file plans, write files, and support dry-run/force.
- Create `src/services/template-generator/types.ts`: define generation contracts.
- Create `src/templates/cli-module/index.ts`: generate `command`, `lib`, and `template` TypeScript skeletons.
- Create `src/templates/cli-module/types.ts`: define template type contracts.
- Modify `src/lib/log.ts`: use named exports and keep console output small and testable.
- Create `src/lib/errors.ts`: define CLI error helpers for predictable failure handling.
- Create `src/lib/name.ts`: normalize and validate module names.
- Remove obsolete component template files under `src/templates/component`.
- Keep or remove `src/templates/nginx/index.ts` only after confirming it is unused; if unused, delete it with the old component templates.
- Create tests under `src/**/__tests__/*.test.ts`.
- Modify `README.md`, `website/docs/intro.md`, and `website/docs/commands/mktpl.md`: document the real CLI behavior.

## Task 1: Establish Test And Dev Tooling

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add test/dev dependencies**

Run:

```bash
yarn remove archiver camelcase cross-spawn del inquirer uuid yargs
yarn add commander chalk fs-extra
yarn add -D vitest tsx @types/fs-extra
```

Expected: `package.json` no longer lists unused production dependencies, and `yarn.lock` is updated.

- [ ] **Step 2: Update scripts and package metadata**

Change `package.json` scripts to this shape:

```json
{
  "scripts": {
    "dev": "tsx bin/index.ts",
    "start": "yarn dev",
    "build": "tsup",
    "start:docs": "cd website && yarn start",
    "build:docs": "cd website && yarn build",
    "deploy:docs": "cd website && yarn deploy",
    "clear:docs": "cd website && yarn clear",
    "serve:docs": "cd website && yarn serve",
    "check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "format": "prettier --write .",
    "fix": "eslint . --fix && prettier --write .",
    "prepublishOnly": "yarn check && yarn lint && yarn test && yarn build",
    "push": "npm publish",
    "prepare": "husky"
  }
}
```

Also ensure:

```json
{
  "main": "dist/index.js",
  "bin": {
    "oh-my-cli": "./dist/index.js"
  },
  "files": [
    "dist"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
})
```

- [ ] **Step 4: Verify baseline tooling command reaches expected failure**

Run:

```bash
yarn test
```

Expected: Vitest runs and reports no tests found or an empty suite before tests are added. If Vitest exits non-zero only because no tests exist, continue to Task 2.

## Task 2: Fix ESM Build And CLI Entry

**Files:**
- Modify: `tsup.config.ts`
- Modify: `bin/index.ts`
- Modify: `src/index.ts`
- Create: `src/lib/errors.ts`

- [ ] **Step 1: Write the CLI entry test**

Create `src/__tests__/cli-entry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createProgram } from '@/index'

describe('createProgram', () => {
  it('registers the mktpl command and version option', () => {
    const program = createProgram()

    expect(program.commands.map((command) => command.name())).toContain('mktpl')
    expect(program.options.map((option) => option.long)).toContain('--version')
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
yarn test src/__tests__/cli-entry.test.ts
```

Expected: FAIL because `createProgram` is not exported yet.

- [ ] **Step 3: Implement CLI error helpers**

Create `src/lib/errors.ts`:

```ts
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
```

- [ ] **Step 4: Implement testable CLI program creation**

Rewrite `src/index.ts`:

```ts
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Command } from 'commander'
import { registerMktplCommand } from '@/commands/mktpl'
import { isCliError } from '@/lib/errors'
import { logError } from '@/lib/log'

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

  program
    .name('oh-my-cli')
    .description(pkg.description ?? 'TypeScript CLI boilerplate')
    .version(pkg.version)
    .showHelpAfterError()
    .showSuggestionAfterError()

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
    if (isCliError(error)) {
      logError(error.message)
      return error.exitCode
    }

    throw error
  }
}
```

- [ ] **Step 5: Implement executable wrapper**

Rewrite `bin/index.ts`:

```ts
#!/usr/bin/env node

import { runCli } from '../src/index'

const exitCode = await runCli(process.argv)

process.exitCode = exitCode
```

- [ ] **Step 6: Align tsup ESM output**

Rewrite `tsup.config.ts`:

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['bin/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  target: 'node18',
  splitting: false,
  sourcemap: false,
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
```

- [ ] **Step 7: Run tests and build**

Run:

```bash
yarn test src/__tests__/cli-entry.test.ts
yarn build
node dist/index.js --help
```

Expected: test passes, `dist/index.js` exists, and help output includes `mktpl`.

## Task 3: Build Template Generator Service

**Files:**
- Create: `src/lib/name.ts`
- Create: `src/services/template-generator/types.ts`
- Create: `src/services/template-generator/index.ts`
- Create: `src/services/template-generator/__tests__/template-generator.test.ts`

- [ ] **Step 1: Write service tests**

Create `src/services/template-generator/__tests__/template-generator.test.ts`:

```ts
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { generateTemplate } from '@/services/template-generator'

const tempDirs: string[] = []

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'oh-my-cli-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('generateTemplate', () => {
  it('plans command files without writing during dry-run', async () => {
    const cwd = await createTempDir()
    const result = await generateTemplate({ name: 'hello', cwd, type: 'command', dryRun: true })

    expect(result.files.map((file) => file.relativePath)).toEqual([
      'src/commands/hello/index.ts',
      'src/commands/hello/types.ts',
      'src/commands/hello/__tests__/hello.test.ts',
    ])
    await expect(readFile(join(cwd, 'src/commands/hello/index.ts'), 'utf8')).rejects.toThrow()
  })

  it('writes lib template files', async () => {
    const cwd = await createTempDir()
    await generateTemplate({ name: 'name-helper', cwd, type: 'lib' })

    const source = await readFile(join(cwd, 'src/lib/name-helper.ts'), 'utf8')
    expect(source).toContain('export function createNameHelper')
  })

  it('rejects an existing target unless force is enabled', async () => {
    const cwd = await createTempDir()

    await generateTemplate({ name: 'hello', cwd, type: 'command' })
    await expect(generateTemplate({ name: 'hello', cwd, type: 'command' })).rejects.toThrow(
      'Target already exists',
    )
    await expect(generateTemplate({ name: 'hello', cwd, type: 'command', force: true })).resolves.toBeDefined()
  })

  it('rejects invalid names', async () => {
    const cwd = await createTempDir()

    await expect(generateTemplate({ name: '../bad', cwd, type: 'command' })).rejects.toThrow(
      'Template name must use kebab-case',
    )
  })
})
```

- [ ] **Step 2: Run failing service tests**

Run:

```bash
yarn test src/services/template-generator/__tests__/template-generator.test.ts
```

Expected: FAIL because the service and template modules do not exist yet.

- [ ] **Step 3: Add name helpers**

Create `src/lib/name.ts`:

```ts
/** Converts a kebab-case module name to PascalCase for generated identifiers. */
export function toPascalCase(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/** Converts a kebab-case module name to camelCase for generated function names. */
export function toCamelCase(name: string): string {
  const pascalName = toPascalCase(name)

  return pascalName.charAt(0).toLowerCase() + pascalName.slice(1)
}

/** Validates generated module names so path traversal and invalid identifiers are rejected early. */
export function isValidKebabName(name: string): boolean {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)
}
```

- [ ] **Step 4: Add generator contracts**

Create `src/services/template-generator/types.ts`:

```ts
import type { CliTemplateType } from '@/templates/cli-module/types'

/** Input accepted by the template generation service. */
export interface GenerateTemplateOptions {
  readonly name: string
  readonly cwd: string
  readonly dirPath?: string
  readonly type: CliTemplateType
  readonly dryRun?: boolean
  readonly force?: boolean
}

/** File planned or written by the generator. */
export interface GeneratedFile {
  readonly absolutePath: string
  readonly relativePath: string
  readonly content: string
}

/** Result returned after planning or writing template files. */
export interface GenerateTemplateResult {
  readonly files: GeneratedFile[]
  readonly didWrite: boolean
}
```

- [ ] **Step 5: Add generator implementation**

Create `src/services/template-generator/index.ts`:

```ts
import { mkdir, pathExists, writeFile } from 'fs-extra'
import { dirname, join, relative, resolve } from 'node:path'
import { createCliError } from '@/lib/errors'
import { isValidKebabName } from '@/lib/name'
import { createCliModuleFiles } from '@/templates/cli-module'
import type {
  GeneratedFile,
  GenerateTemplateOptions,
  GenerateTemplateResult,
} from '@/services/template-generator/types'

function resolveBaseDir(options: GenerateTemplateOptions): string {
  if (!options.dirPath) return options.cwd
  return resolve(options.cwd, options.dirPath)
}

function createFilePlan(options: GenerateTemplateOptions): GeneratedFile[] {
  const baseDir = resolveBaseDir(options)

  return createCliModuleFiles({ name: options.name, type: options.type }).map((file) => {
    const absolutePath = join(baseDir, file.relativePath)

    return {
      absolutePath,
      relativePath: relative(options.cwd, absolutePath),
      content: file.content,
    }
  })
}

async function assertCanWrite(files: GeneratedFile[], force = false): Promise<void> {
  if (force) return

  for (const file of files) {
    if (await pathExists(file.absolutePath)) {
      throw createCliError(`Target already exists: ${file.relativePath}. Use --force to overwrite.`)
    }
  }
}

async function writeFiles(files: GeneratedFile[]): Promise<void> {
  for (const file of files) {
    await mkdir(dirname(file.absolutePath), { recursive: true })
    await writeFile(file.absolutePath, file.content, 'utf8')
  }
}

/** Plans or writes a CLI engineering template. */
export async function generateTemplate(
  options: GenerateTemplateOptions,
): Promise<GenerateTemplateResult> {
  if (!isValidKebabName(options.name)) {
    throw createCliError('Template name must use kebab-case, for example: create-user')
  }

  const files = createFilePlan(options)

  await assertCanWrite(files, options.force)

  if (options.dryRun) {
    return { files, didWrite: false }
  }

  await writeFiles(files)

  return { files, didWrite: true }
}
```

- [ ] **Step 6: Run service tests**

Run:

```bash
yarn test src/services/template-generator/__tests__/template-generator.test.ts
```

Expected: service tests pass after Task 4 adds `src/templates/cli-module`.

## Task 4: Add Pure TypeScript CLI Templates

**Files:**
- Create: `src/templates/cli-module/types.ts`
- Create: `src/templates/cli-module/index.ts`
- Create: `src/templates/cli-module/__tests__/cli-module.test.ts`
- Delete: `src/templates/component/clazz.ts`
- Delete: `src/templates/component/func.ts`
- Delete: `src/templates/component/index.ts`
- Delete: `src/templates/component/style.ts`

- [ ] **Step 1: Write template tests**

Create `src/templates/cli-module/__tests__/cli-module.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createCliModuleFiles } from '@/templates/cli-module'

describe('createCliModuleFiles', () => {
  it('creates command template files', () => {
    const files = createCliModuleFiles({ name: 'hello-world', type: 'command' })

    expect(files.map((file) => file.relativePath)).toEqual([
      'src/commands/hello-world/index.ts',
      'src/commands/hello-world/types.ts',
      'src/commands/hello-world/__tests__/hello-world.test.ts',
    ])
    expect(files[0].content).toContain('export function registerHelloWorldCommand')
  })

  it('creates lib template files', () => {
    const files = createCliModuleFiles({ name: 'name-helper', type: 'lib' })

    expect(files.map((file) => file.relativePath)).toEqual([
      'src/lib/name-helper.ts',
      'src/lib/__tests__/name-helper.test.ts',
    ])
    expect(files[0].content).toContain('export function createNameHelper')
  })

  it('creates template module files', () => {
    const files = createCliModuleFiles({ name: 'release-note', type: 'template' })

    expect(files.map((file) => file.relativePath)).toEqual([
      'src/templates/release-note/index.ts',
      'src/templates/release-note/types.ts',
      'src/templates/release-note/__tests__/release-note.test.ts',
    ])
    expect(files[0].content).toContain('export function getReleaseNoteTemplate')
  })
})
```

- [ ] **Step 2: Add template contracts**

Create `src/templates/cli-module/types.ts`:

```ts
export type CliTemplateType = 'command' | 'lib' | 'template'

/** Input for generating TypeScript CLI engineering templates. */
export interface CreateCliModuleFilesOptions {
  readonly name: string
  readonly type: CliTemplateType
}

/** In-memory generated file before it is written to disk. */
export interface CliModuleFile {
  readonly relativePath: string
  readonly content: string
}
```

- [ ] **Step 3: Add template implementation**

Create `src/templates/cli-module/index.ts`:

```ts
import { toCamelCase, toPascalCase } from '@/lib/name'
import type {
  CliModuleFile,
  CreateCliModuleFilesOptions,
} from '@/templates/cli-module/types'

function createCommandFiles(name: string): CliModuleFile[] {
  const pascalName = toPascalCase(name)

  return [
    {
      relativePath: `src/commands/${name}/index.ts`,
      content: `import type { Command } from 'commander'\nimport type { ${pascalName}CommandOptions } from './types'\n\n/** Registers the ${name} command on the root CLI program. */\nexport function register${pascalName}Command(program: Command): void {\n  program\n    .command('${name}')\n    .description('Describe the ${name} command')\n    .action(async (options: ${pascalName}CommandOptions) => {\n      await handle${pascalName}Command(options)\n    })\n}\n\n/** Handles ${name} command execution after commander parses arguments. */\nexport async function handle${pascalName}Command(_options: ${pascalName}CommandOptions): Promise<void> {\n  // Keep command behavior in this handler so registration stays easy to test.\n}\n`,
    },
    {
      relativePath: `src/commands/${name}/types.ts`,
      content: `/** Options accepted by the ${name} command. */\nexport interface ${pascalName}CommandOptions {}\n`,
    },
    {
      relativePath: `src/commands/${name}/__tests__/${name}.test.ts`,
      content: `import { describe, expect, it } from 'vitest'\nimport { handle${pascalName}Command } from '@/commands/${name}'\n\ndescribe('handle${pascalName}Command', () => {\n  it('runs without throwing', async () => {\n    await expect(handle${pascalName}Command({})).resolves.toBeUndefined()\n  })\n})\n`,
    },
  ]
}

function createLibFiles(name: string): CliModuleFile[] {
  const pascalName = toPascalCase(name)
  const camelName = toCamelCase(name)

  return [
    {
      relativePath: `src/lib/${name}.ts`,
      content: `/** Creates a value for the ${name} helper. */\nexport function create${pascalName}(value: string): string {\n  return value.trim()\n}\n`,
    },
    {
      relativePath: `src/lib/__tests__/${name}.test.ts`,
      content: `import { describe, expect, it } from 'vitest'\nimport { create${pascalName} } from '@/lib/${name}'\n\ndescribe('create${pascalName}', () => {\n  it('normalizes input', () => {\n    const ${camelName} = create${pascalName}(' demo ')\n\n    expect(${camelName}).toBe('demo')\n  })\n})\n`,
    },
  ]
}

function createTemplateFiles(name: string): CliModuleFile[] {
  const pascalName = toPascalCase(name)

  return [
    {
      relativePath: `src/templates/${name}/index.ts`,
      content: `import type { ${pascalName}TemplateOptions } from './types'\n\n/** Returns the ${name} text template. */\nexport function get${pascalName}Template(options: ${pascalName}TemplateOptions): string {\n  return options.name\n}\n`,
    },
    {
      relativePath: `src/templates/${name}/types.ts`,
      content: `/** Input accepted by the ${name} template. */\nexport interface ${pascalName}TemplateOptions {\n  readonly name: string\n}\n`,
    },
    {
      relativePath: `src/templates/${name}/__tests__/${name}.test.ts`,
      content: `import { describe, expect, it } from 'vitest'\nimport { get${pascalName}Template } from '@/templates/${name}'\n\ndescribe('get${pascalName}Template', () => {\n  it('renders the provided name', () => {\n    expect(get${pascalName}Template({ name: 'demo' })).toBe('demo')\n  })\n})\n`,
    },
  ]
}

/** Creates pure TypeScript files for CLI engineering modules. */
export function createCliModuleFiles(options: CreateCliModuleFilesOptions): CliModuleFile[] {
  if (options.type === 'command') return createCommandFiles(options.name)
  if (options.type === 'lib') return createLibFiles(options.name)
  return createTemplateFiles(options.name)
}
```

- [ ] **Step 4: Remove obsolete component templates**

Run:

```bash
rm -rf src/templates/component
```

Expected: no TSX/SCSS/React component template files remain.

- [ ] **Step 5: Run template and service tests**

Run:

```bash
yarn test src/templates/cli-module/__tests__/cli-module.test.ts src/services/template-generator/__tests__/template-generator.test.ts
```

Expected: all tests pass.

## Task 5: Wire `mktpl` Command To The Service

**Files:**
- Modify: `src/commands/mktpl/index.ts`
- Create: `src/commands/mktpl/types.ts`
- Create: `src/commands/mktpl/__tests__/mktpl.test.ts`
- Modify: `src/lib/log.ts`

- [ ] **Step 1: Write command tests**

Create `src/commands/mktpl/__tests__/mktpl.test.ts`:

```ts
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Command } from 'commander'
import { afterEach, describe, expect, it } from 'vitest'
import { registerMktplCommand } from '@/commands/mktpl'

const tempDirs: string[] = []

async function createProgram(cwd: string): Promise<Command> {
  const program = new Command()
  program.exitOverride()
  registerMktplCommand(program)
  program.configureOutput({ writeOut: () => undefined, writeErr: () => undefined })
  await program.parseAsync(['node', 'test', 'mktpl', 'demo', '--cwd', cwd], { from: 'node' })
  return program
}

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'oh-my-cli-command-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('registerMktplCommand', () => {
  it('writes a default command template', async () => {
    const cwd = await createTempDir()

    await createProgram(cwd)

    await expect(readdir(join(cwd, 'src/commands/demo'))).resolves.toContain('index.ts')
  })
})
```

- [ ] **Step 2: Add command option types**

Create `src/commands/mktpl/types.ts`:

```ts
import type { CliTemplateType } from '@/templates/cli-module/types'

/** Commander options accepted by the mktpl command. */
export interface MktplCommandOptions {
  readonly type?: CliTemplateType
  readonly dryRun?: boolean
  readonly force?: boolean
  readonly cwd?: string
}
```

- [ ] **Step 3: Update logger to named exports**

Rewrite `src/lib/log.ts`:

```ts
import chalk from 'chalk'

/** Prints an informational CLI message. */
export function logInfo(message: string): void {
  console.log(chalk.cyan(message))
}

/** Prints a success CLI message. */
export function logSuccess(message: string): void {
  console.log(chalk.green(message))
}

/** Prints a warning CLI message. */
export function logWarning(message: string): void {
  console.warn(chalk.yellow(message))
}

/** Prints an error CLI message. */
export function logError(message: string): void {
  console.error(chalk.red(message))
}
```

- [ ] **Step 4: Rewrite mktpl command**

Rewrite `src/commands/mktpl/index.ts`:

```ts
import type { Command } from 'commander'
import { generateTemplate } from '@/services/template-generator'
import { logInfo, logSuccess } from '@/lib/log'
import type { MktplCommandOptions } from './types'

function getCwd(options: MktplCommandOptions): string {
  return options.cwd ?? process.cwd()
}

/** Registers the mktpl command for generating CLI engineering modules. */
export function registerMktplCommand(program: Command): void {
  program
    .command('mktpl <name> [dirPath]')
    .description('create a TypeScript CLI module template')
    .option('-t, --type <type>', 'template type: command, lib, or template', 'command')
    .option('--dry-run', 'print planned files without writing')
    .option('--force', 'overwrite existing files')
    .option('--cwd <path>', 'working directory for template generation')
    .action(async (name: string, dirPath: string | undefined, options: MktplCommandOptions) => {
      const result = await generateTemplate({
        name,
        dirPath,
        type: options.type ?? 'command',
        dryRun: options.dryRun,
        force: options.force,
        cwd: getCwd(options),
      })

      const prefix = result.didWrite ? 'Created' : 'Planned'

      for (const file of result.files) {
        logInfo(`${prefix}: ${file.relativePath}`)
      }

      if (result.didWrite) logSuccess('Template created successfully.')
    })
}
```

- [ ] **Step 5: Run command tests**

Run:

```bash
yarn test src/commands/mktpl/__tests__/mktpl.test.ts
```

Expected: command test passes.

## Task 6: Clean Obsolete Utilities And Update Imports

**Files:**
- Modify or delete: `src/lib/paths.ts`
- Modify or delete: `src/lib/spinner.ts`
- Modify or delete: `src/lib/util.ts`
- Modify or delete: `src/lib/os.ts`
- Modify or delete: `src/constant/index.ts`
- Delete if unused: `src/templates/nginx/index.ts`

- [ ] **Step 1: Find unused old modules**

Run:

```bash
rg "@/lib/paths|@/lib/spinner|@/lib/util|@/lib/os|@/constant|@/templates/nginx" src bin
```

Expected: after Tasks 2-5, old modules should have no active imports.

- [ ] **Step 2: Delete unused modules**

If the search returns no imports, delete:

```bash
rm -f src/lib/paths.ts src/lib/spinner.ts src/lib/util.ts src/lib/os.ts src/constant/index.ts src/templates/nginx/index.ts
```

Expected: only currently used helpers remain under `src/lib` and `src/templates`.

- [ ] **Step 3: Run typecheck**

Run:

```bash
yarn check
```

Expected: PASS with no missing import errors.

## Task 7: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `website/docs/intro.md`
- Modify: `website/docs/commands/mktpl.md`

- [ ] **Step 1: Rewrite README**

Replace `README.md` with:

```md
# oh-my-cli

TypeScript CLI boilerplate for building small, testable command-line tools.

## Requirements

- Node.js >= 18
- Yarn v1

## Install

\`\`\`bash
yarn install
\`\`\`

## Development

\`\`\`bash
yarn dev --help
yarn dev mktpl demo --dry-run
\`\`\`

## Scripts

- `yarn dev`: run the CLI from TypeScript source.
- `yarn check`: run TypeScript type checking.
- `yarn lint`: run ESLint.
- `yarn test`: run Vitest.
- `yarn build`: build `dist/index.js`.
- `yarn prepublishOnly`: run the release gate.

## Commands

### `mktpl <name> [dirPath]`

Creates pure TypeScript CLI engineering templates.

\`\`\`bash
yarn dev mktpl hello-world
yarn dev mktpl name-helper --type lib
yarn dev mktpl release-note --type template --dry-run
\`\`\`

Supported template types:

- `command`: creates `src/commands/<name>/`.
- `lib`: creates `src/lib/<name>.ts`.
- `template`: creates `src/templates/<name>/`.

Options:

- `-t, --type <type>`: `command`, `lib`, or `template`.
- `--dry-run`: print planned files without writing.
- `--force`: overwrite existing files.
- `--cwd <path>`: use a custom working directory.

## Build Verification

\`\`\`bash
yarn build
node dist/index.js --help
\`\`\`
```

- [ ] **Step 2: Rewrite Docusaurus intro**

Replace `website/docs/intro.md` with:

```md
---
sidebar_position: 1
slug: /
---

# oh-my-cli

`oh-my-cli` 是一个 TypeScript CLI boilerplate，用于开发小型、可测试、可发布的命令行工具。

## 环境要求

- Node.js >= 18
- Yarn v1

## 本地开发

\`\`\`bash
yarn install
yarn dev --help
\`\`\`

## 质量检查

\`\`\`bash
yarn check
yarn lint
yarn test
yarn build
node dist/index.js --help
\`\`\`

## 设计边界

该项目面向 CLI 工程模块生成，不生成 React、TSX、SCSS 或业务页面文件。
```

- [ ] **Step 3: Rewrite mktpl docs**

Replace `website/docs/commands/mktpl.md` with:

```md
---
title: mktpl - 创建 CLI 工程模板
sidebar_label: mktpl
---

# mktpl

`mktpl` 用于生成纯 TypeScript CLI 工程模块。

## 基本使用

\`\`\`bash
oh-my-cli mktpl <name> [dirPath]
\`\`\`

## 模板类型

### command

\`\`\`bash
oh-my-cli mktpl hello-world --type command
\`\`\`

输出：

\`\`\`text
src/commands/hello-world/
  index.ts
  types.ts
  __tests__/hello-world.test.ts
\`\`\`

### lib

\`\`\`bash
oh-my-cli mktpl name-helper --type lib
\`\`\`

输出：

\`\`\`text
src/lib/name-helper.ts
src/lib/__tests__/name-helper.test.ts
\`\`\`

### template

\`\`\`bash
oh-my-cli mktpl release-note --type template
\`\`\`

输出：

\`\`\`text
src/templates/release-note/
  index.ts
  types.ts
  __tests__/release-note.test.ts
\`\`\`

## 参数

- `-t, --type <type>`：模板类型，支持 `command`、`lib`、`template`，默认 `command`。
- `--dry-run`：只打印将创建的文件，不写入磁盘。
- `--force`：目标文件存在时覆盖。
- `--cwd <path>`：指定工作目录。
```

- [ ] **Step 4: Build docs**

Run:

```bash
yarn build:docs
```

Expected: Docusaurus build succeeds.

## Task 8: Final Verification And Audit

**Files:**
- Verify all modified files
- Commit final implementation

- [ ] **Step 1: Run full quality gate**

Run:

```bash
yarn check
yarn lint
yarn test
yarn build
node dist/index.js --help
```

Expected: all commands pass, help output includes `mktpl`, and `dist/index.js` exists.

- [ ] **Step 2: Verify CLI generation manually**

Run:

```bash
tmp_dir="$(mktemp -d)"
node dist/index.js mktpl demo --cwd "$tmp_dir" --type command
find "$tmp_dir" -type f | sort
```

Expected output includes:

```text
src/commands/demo/__tests__/demo.test.ts
src/commands/demo/index.ts
src/commands/demo/types.ts
```

- [ ] **Step 3: Run dependency audit**

Run:

```bash
yarn audit --groups dependencies
```

Expected: no production vulnerabilities from removed unused dependencies. If Yarn reports registry-level advisories unrelated to remaining production dependencies, record them in the final response.

- [ ] **Step 4: Review git diff**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, only planned files changed.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add package.json yarn.lock tsup.config.ts tsconfig.json vitest.config.ts bin src README.md website/docs
git commit -m "feat(src): modernize cli boilerplate" -m "AI-Co-Authored-By: Codex"
```

Expected: commit succeeds with scope `src`, satisfying current commitlint rules.

## Self-Review

- Spec coverage: build/bin alignment is covered by Task 2; pure TypeScript templates by Tasks 3-5; dependency cleanup by Task 1 and Task 8; docs by Task 7; verification by Task 8.
- Completeness scan: this plan contains no unfinished markers or unspecified implementation steps.
- Type consistency: `CliTemplateType`, `GenerateTemplateOptions`, `MktplCommandOptions`, and command registration names are consistent across tasks.

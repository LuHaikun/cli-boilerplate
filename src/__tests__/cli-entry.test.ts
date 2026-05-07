import { afterEach, describe, expect, it, vi } from 'vitest'
import { createProgram, runCli } from '../index'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createProgram', () => {
  it('registers the mktpl command and version option', () => {
    const program = createProgram()

    expect(program.commands.map((command) => command.name())).toContain('mktpl')
    expect(program.options.map((option) => option.long)).toContain('--version')
  })

  it('shows implemented command examples in root help', () => {
    const helpInformation = createProgram().helpInformation()

    expect(helpInformation).toContain('examples:')
    expect(helpInformation).toContain('$ mktpl <templateName> [dirPath]')
    expect(helpInformation).toContain('$ oh-my-cli mktpl Login ./src/views')
  })
})

describe('runCli', () => {
  it('returns a non-zero exit code for unknown commands instead of exiting the process', async () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null) => {
        throw new Error(`process.exit:${code ?? 0}`)
      })

    await expect(runCli(['node', 'oh-my-cli', 'unknown-command'])).resolves.toBeGreaterThan(0)
    expect(exitSpy).not.toHaveBeenCalled()
  })
})

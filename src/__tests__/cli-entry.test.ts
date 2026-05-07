import { describe, expect, it } from 'vitest'
import { createProgram } from '../index'

describe('createProgram', () => {
  it('registers the mktpl command and version option', () => {
    const program = createProgram()

    expect(program.commands.map((command) => command.name())).toContain('mktpl')
    expect(program.options.map((option) => option.long)).toContain('--version')
  })
})

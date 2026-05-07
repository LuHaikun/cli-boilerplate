import { createRequire } from 'module'
import { Command } from 'commander'
import log from '@/lib/log'
import mktpl from '@/commands/mktpl'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const program = new Command().version(pkg.version).on('--help', function () {
  log.tip('')
  log.tip('examples:')
  log.tip('')
  log.tip('  $ mktpl <templateName> [dirPath]')
  log.tip('  $ oh-my-cli mktpl Login ./src/views')
  log.tip('')
  log.tip('  $ clone <projectName> [dirPath]')
  log.tip('  $ oh-my-cli clone etl-web /Users/luhk/Downloads/')
})

program
  .command('mktpl <templateName> [dirPath]')
  .option('-t, --type [type]', 'set component type with optional type')
  .description('create the dictory for template')
  .action((templateName, dirPath, options) => {
    mktpl(templateName, dirPath, options.type)
  })

program.parse(process.argv)

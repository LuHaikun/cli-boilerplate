const { Command } = require('commander')
const log = require('../src/lib/log')
const pkg = require('../package.json')
const mktpl = require('./commands/mktpl')
const mkbpl = require('./commands/mkbpl')

const program = new Command()
  .version(pkg.version)
  .on('--help', function () {
    log.tip('')
    log.tip('examples:')
    log.tip('')
    log.tip('  $ mktpl <templateName> [dirPath]')
    log.tip('  $ cec-cli mktpl Login ./src/views')
    log.tip('')
    log.tip('  $ clone <projectName> [dirPath]')
    log.tip('  $ cec-cli clone etl-web /Users/luhk/Downloads/')
  })

program.command('mktpl <templateName> [dirPath]')
  .option('-t, --type [type]', 'set component type with optional type')
  .description('create the dictory for template')
  .action((templateName, dirPath, options) => {
    mktpl(templateName, dirPath, options.type)
  })

program.command('mkbpl <projectName> [dirPath]')
  .option('-t, --type [type]', 'Add boilerplate type with optional type')
  .description('create the react boilerplate for new project')
  .action((projectName, dirPath, options) => {
    mkbpl(projectName, dirPath, options.type)
  })

program.parse(process.argv)

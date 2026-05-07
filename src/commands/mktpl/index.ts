import fs from 'fs-extra'
import type { Command } from 'commander'
import log from '@/lib/log'
import path from '@/lib/paths'
import Spinner from '@/lib/spinner'
import { isEmpty } from '@/lib/util'
import getFuncTemplate from '@/templates/component/func'
import getClassTemplate from '@/templates/component/clazz'
import getIndexTemplate from '@/templates/component/index'
import getStyleTemplate from '@/templates/component/style'

const mktpl = (templateName: string, dirPath: string, templateType: string) => {
  log.tip('create template starting')
  const spinner = new Spinner('creating...')
  // 获取模板创建目录
  const templateDir = path.getTodoPath(dirPath, templateName)
  fs.pathExists(templateDir).then((exists) => {
    if (exists) {
      log.warning(`${templateDir} 文件夹已存在`)
      spinner.stop()
    } else {
      // 创建目录
      if (!isEmpty(templateType) && templateType !== 'func' && templateType !== 'class') {
        log.error('组件类型必须是[func|calss] 或者缺省')
        spinner.stop()
      } else {
        try {
          fs.ensureDirSync(templateDir)
          log.success(`创建 ${templateDir} 文件夹成功`)
          createTemplate(templateDir, templateName, templateType, spinner)
        } catch (err: unknown) {
          log.error(err)
        }
      }
    }
  })
}

const createTemplate = (dir: string, name: string, type: string, spinner: Spinner) => {
  // 变更 Node.js 进程的当前工作目录
  process.chdir(dir)
  // 创建jsx文件
  const templateFile = path.join(dir, `${name}.jsx`)
  const content = type === 'func' ? getFuncTemplate(name) : getClassTemplate(name)
  fs.writeFileSync(templateFile, content)
  const indexFile = path.join(dir, 'index.js')
  fs.writeFileSync(indexFile, getIndexTemplate(name))
  const styleFile = path.join(dir, 'style.scss')
  fs.writeFileSync(styleFile, getStyleTemplate(name))
  log.success('create template success')
  spinner.stop()
}

/** Registers the existing mktpl action on the root CLI program. */
export function registerMktplCommand(program: Command): void {
  program
    .command('mktpl <templateName> [dirPath]')
    .option('-t, --type [type]', 'set component type with optional type')
    .description('create the dictory for template')
    .action((templateName, dirPath, options) => {
      mktpl(templateName, dirPath, options.type)
    })
}

export default mktpl

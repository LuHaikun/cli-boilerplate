/**
 * @author 陆海鹍
 * @date 2020-05-12 11:11:51
 * @description 描述 自动生成React开发套件
 * @email luhaikun@cecdat.com
 * @copyright Copyright 2018 CEC(Fujian) Healthcare Big Data Operation Service Co., Ltd. All rights reserved.
 */
const fs = require('fs-extra')
const log = require('../../lib/log')
const path = require('../../lib/paths')
const Spinner = require('../../lib/spinner')
const { isEmpty } = require('../../lib/util')
const getFuncTemplate = require('../../templates/component/func')
const getClassTemplate = require('../../templates/component/clazz')
const getIndexTemplate = require('../../templates/component/index')
const getStyleTemplate = require('../../templates/component/style')

const mktpl = (templateName, dirPath, templateType) => {
  log.tip('create template starting')
  const spinner = new Spinner('creating...')
  // 获取模板创建目录
  const templateDir = path.getTodoPath(dirPath, templateName)
  fs.pathExists(templateDir)
    .then((exists) => {
      if (exists) {
        log.warning(`${templateDir} 文件夹已存在`)
        spinner.stop()
      } else {
        // 创建目录
        if (!isEmpty(templateType) && (templateType !== 'func' && templateType !== 'class')) {
          log.error('组件类型必须是[func|calss] 或者缺省')
          spinner.stop()
        } else {
          fs.ensureDirSync(templateDir, err => log.error(err))
          log.success(`创建 ${templateDir} 文件夹成功`)
          createTemplate(templateDir, templateName, templateType, spinner)
        }
      }
    })
}

const createTemplate = (dir, name, type, spinner) => {
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

module.exports = mktpl

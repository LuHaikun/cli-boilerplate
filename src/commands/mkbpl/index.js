/**
 * @author 陆海鹍
 * @date 2020-05-12 09:51:25
 * @description 描述 自动生成前端项目脚手架脚本
 * @email luhaikun@cecdat.com
 * @copyright Copyright 2018 CEC(Fujian) Healthcare Big Data Operation Service Co., Ltd. All rights reserved.
 */
const fs = require('fs-extra')
const spawn = require('cross-spawn')
const download = require('download-git-repo')
const os = require('../../lib/os')
const log = require('../../lib/log')
const path = require('../../lib/paths')
const boilerplate = require('../../configs/boilerplate')
const Spinner = require('../../lib/spinner')

const mkbpl = (projectName, dirPath, projectType) => {
  log.tip('create boilerplate starting')
  const spinner = new Spinner('creating...')
  let tplURL = boilerplate.react
  if (projectType) tplURL = boilerplate[projectType]

  if (!projectName) {
    log.error('必须填写项目名称,例如 mkbpl project')
    spinner.stop()
  }

  if (!tplURL) {
    log.error(`${projectType} 模板类型不存在`)
    spinner.stop()
  }
  const appDir = path.getTodoPath(dirPath, projectName)

  fs.pathExists(appDir)
    .then((exists) => {
      if (exists) {
        log.warning(`${appDir} 文件夹已存在`)
        spinner.stop()
      } else {
        // 创建目录
        fs.ensureDirSync(appDir, err => log.error(err))
        log.success(`创建 ${appDir} 文件夹成功`)
        downloadBoilerplate(tplURL, appDir, projectName, spinner)
      }
    })
}

const downloadBoilerplate = (tplURL, appDir, projectName, spinner) => {
  const isWindows = os.isWindows()
  const npmCommond = isWindows ? 'cnpm' : 'npm'
  const npmCommondArgs = ['--registry=http://192.168.1.111:8081/repository/npm-group/', 'install']
  process.chdir(appDir)
  spawn.sync('git', ['init'], { stdio: 'inherit' })
  log.success('初始化 git 成功')
  log.tip('请自行指定 git 远程地址，git remote add <git url>')
  download(`direct:${tplURL}`, appDir, function (err) {
    if (err) {
      log.error('下载模板出错 ...')
      return false
    }
    log.success('生成模板文件成功')
    log.warning('正在安装依赖 ...')
    spawn.sync(npmCommond, ['install', '-g', 'commitlint'], { stdio: 'inherit' })
    if (isWindows) spawn.sync(npmCommond, ['install', '-g', 'cnpm'], { stdio: 'inherit' })
    spawn.sync(npmCommond, npmCommondArgs, { stdio: 'inherit' })
    log.success('安装依赖成功')
    log.tip('---------------------------')
    log.success('执行以下命令就能愉快的开始了：')
    log.tip(`cd ./${projectName} && npm run dev`)
    spinner.stop()
  })
}

module.exports = mkbpl

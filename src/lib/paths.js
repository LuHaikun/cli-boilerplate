const fs = require('fs')
const path = require('path')
const { isEmpty } = require('../lib/util')
const pwd = fs.realpathSync(process.cwd())

const getPath = (dirName = '') => {
  return path.resolve(pwd, dirName)
}

const getTodoPath = (dirPath, templateName) => {
  let templateDir
  if (isEmpty(dirPath)) {
    templateDir = path.resolve(pwd, templateName)
  } else {
    if (path.isAbsolute(dirPath)) {
      templateDir = path.join(dirPath, templateName)
    } else {
      templateDir = path.resolve(pwd, dirPath, templateName)
    }
  }
  return templateDir
}

const PATH_SRC = getPath('src')
const PATH_DIST = getPath('dist')
const NODE_MODULES = '/node_modules/'

module.exports = {
  src: PATH_SRC,
  dist: PATH_DIST,
  nodeModules: NODE_MODULES,
  pwd: pwd,
  getPath: getPath,
  join: path.join,
  getTodoPath: getTodoPath,
  isAbsolute: path.isAbsolute,
  resolve: path.resolve
}

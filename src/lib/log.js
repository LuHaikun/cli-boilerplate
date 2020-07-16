/**
 * @author 陆海鹍
 * @date 2020-03-19 14:06:52
 * @description 描述 控制台输出
 * @email luhaikun@cecdat.com
 * @copyright Copyright 2018 CEC(Fujian) Healthcare Big Data Operation Service Co., Ltd. All rights reserved.
 */
const chalk = require('chalk')

module.exports = {
  success: function (msg) {
    console.log(chalk.green(msg))
  },
  warning: function (msg) {
    console.warn(chalk.yellow(msg))
  },
  error: function (msg) {
    console.error(chalk.red(msg))
  },
  tip: function (msg) {
    console.log(chalk.cyan(msg))
  }
}

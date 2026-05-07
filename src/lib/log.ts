/**
 * @author 陆海鹍
 * @date 2020-03-19 14:06:52
 * @description 描述 控制台输出
 * @email luhaikun@cecdat.com
 * @copyright Copyright 2018 CEC(Fujian) Healthcare Big Data Operation Service Co., Ltd. All rights reserved.
 */
import chalk from 'chalk'

export default {
  success: function (msg: string) {
    console.log(chalk.green(msg))
  },
  warning: function (msg: string) {
    console.warn(chalk.yellow(msg))
  },
  error: function (msg: unknown) {
    console.error(chalk.red(String(msg)))
  },
  tip: function (msg: string) {
    console.log(chalk.cyan(msg))
  },
}

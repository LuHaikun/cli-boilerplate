const CLI = require('clui')
const Spinner = CLI.Spinner

module.exports = function (message) {
  let time = 0
  const countdown = new Spinner(message, ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'])
  countdown.start()
  setInterval(function () {
    time++
    countdown.message(`${message}, lasted ${time} seconds. `)
  }, 1000)
  this.stop = function () {
    countdown.stop()
    process.exit(1)
  }
}

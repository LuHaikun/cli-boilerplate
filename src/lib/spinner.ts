// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import CLI from 'clui'

export default class Spinner {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private countdown: any
  private interval: NodeJS.Timeout
  private time: number = 0

  constructor(message: string) {
    this.countdown = new CLI.Spinner(message, ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'])
    this.countdown.start()
    this.interval = setInterval(() => {
      this.time++
      this.countdown.message(`${message}, lasted ${this.time} seconds. `)
    }, 1000)
  }

  stop() {
    if (this.interval) clearInterval(this.interval)
    this.countdown.stop()
  }
}

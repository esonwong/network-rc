const defaultChannelList = [
  { name: '电调', pin: 13 }
]

class Status {
  constructor(options) {
    this.options = options

    this.currentSpeedRateValue = 0;

    this.password = undefined

    this.sharedCode = undefined

    /** 自动刹车的延迟时间 */
    this.autoLockTime = 500

    this.autoLocking = false

    /** 刹车锁定后 正常心跳统计， 大于 5 就解锁 */
    this.unlockHearbertCount = 0

    this.channelList = defaultChannelList
  }

  resetChannelList() {
    this.channelList = defaultChannelList
  }
}




module.exports = new Status()
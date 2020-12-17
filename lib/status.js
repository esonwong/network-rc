const defaultChannelList = [
  { name: '电调', pin: 13 }
]
class Status {
  constructor(options) {
    this.options = options

    this.password = undefined,

      this.sharedCode = undefined,

      this.channelList = defaultChannelList
  }

  resetChannelList() {
    this.channelList = defaultChannelList
  }
}




module.exports = new Status()
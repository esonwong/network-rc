const defaultChannelList = [
  { name: '电调', pin: 13 }
]

const statusManager = function(){
  return {
    password: undefined,
    sharedCode: undefined,
    channelList: defaultChannelList
  }
}

statusManager.prototype.resetChannelList = function(){
  this.channelList = defaultChannelList
}





module.exports = statusManager

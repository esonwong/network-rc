const { mkdirSync, writeFileSync, readFileSync, existsSync } = require('fs')


const defaultChannelList = [
  { name: '电调', pin: 13 }
]

const defaultConfig = {
  /** 自动刹车的延迟时间 */
  autoLockTime: 500,

  /** 摄像头采集分辨率最大宽度 */
  cameraMaxWidth: 640,

  /** 电调最大功率百分比 */
  maxSpeed: 100,

  /** 舵机反向 */
  directionFix: 0,

  /** 舵机修正 */
  directionReverse: false,

  /** 油门反向 */
  speedReverse: false,

  enabledHttps: false
}

if (!existsSync('/tmp')) {
  mkdirSync('/tmp')
}
const configPath = '/tmp/network-rc-config.json'
if (!existsSync(configPath)) {
  writeFileSync(configPath, JSON.stringify(defaultConfig))
}


class Status {
  constructor(options) {
    this.options = options

    this.currentSpeedRateValue = 0;

    this.password = undefined

    this.sharedCode = undefined

    this.autoLocking = false

    /** 刹车锁定后 正常心跳统计， 大于 5 就解锁 */
    this.unlockHearbertCount = 0

    this.channelList = defaultChannelList

    this.config = JSON.parse(readFileSync(configPath, 'utf8'));

  }

  resetChannelList() {
    this.channelList = defaultChannelList
  }

  saveConfig(obj) {
    Object.keys(obj).map(key => {
      this.config[key] = obj[key]
    })
    console.log("保存设置", this.config)
    writeFileSync(configPath, JSON.stringify(this.config))
  }
}




module.exports = new Status()
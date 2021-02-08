const { writeFileSync, readFileSync, existsSync } = require("fs");

const defaultChannelList = [
  {
    enabled: false,
    name: "电调",
    pin: 13,
    type: "pwm",
    method: "default",
    ui: [{ id: "油门", positive: true }],
    keyboard: [
      { name: "w", positive: true },
      { name: "s", positive: false },
    ],
    gamepad: [
      { name: "axe-1", positive: true },
      { name: "button-7", positive: true },
      { name: `button-6`, positive: false },
    ],
    valuePostive: 1,
    valueNegative: -1,
    valueReset: 0,
  },
  {
    enabled: false,
    name: "舵机",
    pin: 12,
    type: "pwm",
    method: "default",
    ui: [{ id: "方向", positive: true }],
    keyboard: [
      { name: "a", positive: true },
      { name: "d", positive: false },
    ],
    gamepad: [{ name: "axe-0", positive: true }],
    valuePostive: 1,
    valueNegative: -1,
    valueReset: 0,
  },
  {
    enabled: true,
    name: "云台x",
    pin: 22,
    type: "pwm",
    method: "step",
    ui: [{ id: "云台", positive: true, axis: "x" }],
    keyboard: [
      { name: "j", positive: true },
      { name: "l", positive: false },
      { name: "p", reset: true },
    ],
    gamepad: [{ name: "axe-2", positive: true }],
    valuePostive: 2,
    valueNegative: -2,
    valueReset: 0,
  },
  {
    enabled: true,
    name: "云台y",
    pin: 23,
    type: "pwm",
    method: "step",
    ui: [{ id: "云台", positive: false, axis: "y" }],
    keyboard: [
      { name: "i", positive: true },
      { name: "k", positive: false },
      { name: "p", reset: true },
    ],
    gamepad: [{ name: "axe-2", positive: true }],
    valuePostive: 2,
    valueNegative: -2,
    valueReset: 0,
  },
];

const defaultUIComponentList = [
  {
    enabled: false,
    name: "油门",
    id: "油门",
    type: "slider",
    vertical: true,
    size: 1,
    postion: { x: 0, y: 0 },
  },
  {
    enabled: false,
    name: "方向",
    id: "方向",
    type: "slider",
    vertical: false,
    size: 1,
    postion: { x: 0, y: 0 },
  },
  {
    enabled: true,
    name: "云台",
    id: "云台",
    type: "joystick",
    size: 1,
    postion: { x: 452, y: 219 },
  },
];

const defaultConfig = {
  /** 自动刹车的延迟时间 */
  autoLockTime: 500,

  /** 摄像头采集分辨率最大宽度 */
  cameraMaxWidth: 640,

  /** 电调最大功率百分比 */
  maxSpeed: 100,

  /** 舵机修正 */
  directionFix: 0,

  /** 舵机反向 */
  directionReverse: false,

  /** 油门反向 */
  speedReverse: false,

  enabledHttps: false,

  /** 手柄左摇杆是否控制油门 */
  enabledAxis1Controal: false,

  /** 分享控制码 */
  sharedCode: undefined,

  /** 分享时间 */
  sharedDuration: 10 * 60 * 1000,

  channelList: defaultChannelList,

  uiComponentList: defaultUIComponentList,

  audio1: "../assets/audio1.mp3",
  audio2: "../assets/audio2.mp3",
  audio3: "../assets/audio3.mp3",
  audio4: "../assets/audio4.mp3",
};

const configPath = "/var/network-rc-config.json";
if (!existsSync(configPath)) {
  writeFileSync(configPath, JSON.stringify(defaultConfig));
}

class Status {
  constructor(options) {
    this.options = options;

    this.currentSpeedRateValue = 0;

    this.password = undefined;

    this.autoLocking = false;

    /** 刹车锁定后 正常心跳统计， 大于 5 就解锁 */
    this.unlockHearbertCount = 0;

    try {
      this.config = {
        ...defaultConfig,
        ...JSON.parse(readFileSync(configPath, "utf8")),
      };
    } catch (e) {
      console.error(e);
      this.config = defaultConfig;
    }
  }

  resetChannelAndUI() {
    saveConfig({
      channelList: defaultChannelList,
      uiComponentList: defaultUIComponentList,
    });
  }

  saveConfig(obj) {
    Object.keys(obj).map((key) => {
      this.config[key] = obj[key];
    });
    // console.log("保存设置", this.config)
    writeFileSync(configPath, JSON.stringify(this.config));
  }
}

module.exports = new Status();

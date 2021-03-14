const { localSave, localGet } = require("./unit");
const EventEmitter = require("events");

const defaultChannelList = [
  {
    enabled: true,
    name: "电调",
    id: "电调",
    pin: 13,
    type: "pwm",
    ui: [{ id: "油门", positive: true, method: "default" }],
    keyboard: [
      { name: "w", positive: true, method: "default" },
      { name: "s", positive: false, method: "default" },
    ],
    gamepad: [
      { name: "button-7", positive: true, method: "default" },
      { name: `button-6`, positive: false, method: "default" },
    ],
    valuePostive: 0.5,
    valueNegative: -0.5,
    valueReset: 0,
  },
  {
    enabled: true,
    name: "舵机",
    id: "舵机",
    pin: 12,
    type: "pwm",
    method: "default",
    ui: [{ id: "方向", positive: true, method: "default" }],
    keyboard: [
      { name: "a", positive: true, method: "default" },
      { name: "d", positive: false, method: "default" },
    ],
    gamepad: [{ name: "axis-0", positive: false, method: "default" }],
    valuePostive: 1,
    valueNegative: -1,
    valueReset: 0,
  },
  {
    enabled: true,
    name: "云台x",
    id: "云台x",
    pin: 22,
    type: "pwm",
    ui: [{ id: "云台", positive: true, axis: "x", method: "default" }],
    keyboard: [
      { name: "j", positive: true, method: "step", speed: 0.5 },
      { name: "l", positive: false, method: "step", speed: 0.5 },
      { name: "p", reset: true },
    ],
    gamepad: [{ name: "axis-2", positive: true, method: "step", speed: 0.5 }],
    valuePostive: 2,
    valueNegative: -2,
    valueReset: 0,
    orientation: {
      axis: "x",
    },
  },
  {
    enabled: true,
    name: "云台y",
    id: "云台y",
    pin: 23,
    type: "pwm",
    ui: [{ id: "云台", positive: false, axis: "y", method: "default" }],
    keyboard: [
      { name: "i", positive: true, method: "step", speed: 0.5 },
      { name: "k", positive: false, method: "step", speed: 0.5 },
      { name: "p", reset: true },
    ],
    gamepad: [{ name: "axis-3", positive: true, method: "step", speed: 0.5 }],
    valuePostive: 1,
    valueNegative: -1,
    valueReset: 0,
    orientation: {
      axis: "y",
    },
  },
  {
    enabled: true,
    name: "电调",
    id: "电调电源",
    pin: 17,
    type: "switch",
    keyboard: [{ name: "q" }],
    gamepad: [{ name: "button-9", positive: true }],
  },
  {
    enabled: true,
    name: "车灯",
    id: "车灯",
    pin: 27,
    type: "switch",
    ui: [{ id: "车灯", positive: true }],
    keyboard: [{ name: "e" }],
    gamepad: [{ name: "button-0", positive: true }],
  },
];

const defaultSpecialChannel = {
  speed: "电调",
  direction: "舵机",
};

const defaultUIComponentList = [
  {
    enabled: true,
    name: "油门",
    id: "油门",
    type: "slider",
    vertical: true,
    autoReset: true,
    defaultPosition: {
      portrait: {
        x: 22.037353515625,
        y: 470.1780700683594,
        z: 3,
        size: {
          width: 65,
          height: 200,
        },
      },
      landscape: {
        x: 81.03462219238281,
        y: 114.36590576171875,
        z: 3,
        size: {
          width: 53,
          height: 164,
        },
      },
    },
  },
  {
    enabled: true,
    name: "方向",
    id: "方向",
    type: "slider",
    vertical: false,
    autoReset: true,
    defaultPosition: {
      portrait: {
        x: 142.10659790039062,
        y: 537.4343109130859,
        z: 4,
        size: {
          width: 228,
          height: 72,
        },
      },
      landscape: {
        x: 546.9650573730469,
        y: 140.82928466796875,
        z: 4,
        size: {
          width: 187,
          height: 60,
        },
      },
    },
  },
  {
    enabled: true,
    name: "云台",
    id: "云台",
    type: "joystick",
    autoReset: false,
    defaultPosition: {
      portrait: {
        x: 103.10848999023438,
        y: 345.5633544921875,
        z: 5,
        size: {
          width: 145,
          height: 145,
        },
      },
      landscape: {
        x: 586.1330108642578,
        y: 231.12619018554688,
        z: 5,
        size: {
          width: 102,
          height: 102,
        },
      },
    },
  },
];

const defaultConfig = {
  /** 自动刹车的延迟时间 */
  autoLockTime: 400,

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

  specialChannel: defaultSpecialChannel,

  uiComponentList: defaultUIComponentList,

  audio1: "../assets/audio1.mp3",
  audio2: "../assets/audio2.mp3",
  audio3: "../assets/audio3.mp3",
  audio4: "../assets/audio4.mp3",
};

const configPath = "/var/network-rc-config.json";

class Status extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;

    this.currentSpeedRateValue = 0;

    this.password = undefined;

    try {
      this.config = {
        ...defaultConfig,
        ...localGet(configPath),
      };
    } catch (e) {
      console.error(e);
      this.config = defaultConfig;
    }
  }

  resetChannelAndUI() {
    this.saveConfig({
      channelList: defaultChannelList,
      specialChannel: defaultSpecialChannel,
      uiComponentList: defaultUIComponentList,
    });
  }

  saveConfig(obj) {
    Object.keys(obj).map((key) => {
      this.config[key] = obj[key];
    });
    localSave(configPath, this.config);
    this.emit("update");
  }

  resetConfig() {
    this.config = defaultConfig;
    localSave(configPath, this.config);
    this.emit("update");
  }
}

module.exports = new Status();

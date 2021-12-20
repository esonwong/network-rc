const { localSave, localGet } = require("./unit");
const EventEmitter = require("events");
const homedir = require("os").homedir();
const configPath = `${homedir}/.network-rc/config.json`;
const path = require("path");

const defaultChannelList = [
  {
    enabled: true,
    name: "电调",
    id: "电调",
    pin: 13,
    type: "pwm",
    ui: [{ id: "油门", positive: true, method: "default" }],
    keyboard: [
      { name: "w", speed: 1, method: "default", autoReset: true },
      { name: "s", speed: -1, method: "default", autoReset: true },
      { name: "ArrowUp", speed: 0.5, method: "default", autoReset: true },
      { name: "ArrowDown", speed: -0.5, method: "default", autoReset: true },
    ],
    gamepad: [
      { name: "button-4", speed: -0.5, method: "default", autoReset: true },
      { name: `button-6`, speed: -1, method: "default", autoReset: true },
      { name: `button-5`, speed: 0.5, method: "default", autoReset: true },
      { name: "button-7", speed: 1, method: "default", autoReset: true },
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
      { name: "a", speed: 1, method: "default", autoReset: true },
      { name: "d", speed: -1, method: "default", autoReset: true },
    ],
    gamepad: [{ name: "axis-0", speed: -1, method: "default" }],
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
      { name: "j", speed: 0.5, method: "step" },
      { name: "l", speed: -0.5, method: "step" },
      { name: "p", speed: 0, method: "default" },
    ],
    gamepad: [{ name: "axis-2", speed: 1, method: "step" }],
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
      { name: "i", method: "step", speed: 0.5 },
      { name: "k", method: "step", speed: -0.5 },
      { name: "p", speed: 0, method: "default" },
    ],
    gamepad: [{ name: "axis-3", method: "step", speed: 0.5 }],
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
    keyboard: [{ name: "q", speed: 1, autoReset: false }],
    gamepad: [{ name: "button-9", speed: 1, autoReset: false }],
  },
  {
    enabled: true,
    name: "车灯",
    id: "车灯",
    pin: 27,
    type: "switch",
    ui: [{ id: "车灯", positive: true }],
    keyboard: [{ name: "e", speed: 1, autoReset: false }],
    gamepad: [{ name: "button-0", speed: 1, autoReset: false }],
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

  /** 自动刹车的反响制动的时长 */
  brakeTime: 100,

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

  audio1: path.resolve(__dirname, "../assets/audio1.mp3"),
  audio2: path.resolve(__dirname, "../assets/audio2.mp3"),
  audio3: path.resolve(__dirname, "../assets/audio3.mp3"),
  audio4: path.resolve(__dirname, "../assets/audio4.mp3")
};

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

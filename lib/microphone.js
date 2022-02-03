const { EventEmitter } = require("events");
const { execSync } = require("child_process");

class Microphone extends EventEmitter {
  constructor(options) {
    super(options);
    this.options = options;
    this.list = [];
    this.playing = false;
    this.streamer = undefined;
  }

  /**
   * 获取麦克风设备列表
   */
  async getMicphoneList() {
    const output = execSync("LANG=en pactl list sources").toString();

    const matchList = Array.from(
      output.matchAll(
        /Source #(\d+)[\s\S]+?Name: (.+)[\s\S]+?Description: (.+)[\s\S]+?Volume: [\s\S]+?(\d+)\%/g
      )
    );

    const list = matchList.map(([, index, name, description, volume]) => ({
      index,
      displayName: description,
      name,
      volume,
      description,
    }));

    logger.info("获取音频设备列表", list);
    this.list = list;
    return list;
  }

  // 获取当前播麦克风
  async getMicphone() {
    const output = execSync("LANG=en pactl info").toString();
    const [, name] = output.match(/Default Source: (.+?)\n/) || [];
    logger.info("获取当前播麦克风", name);
    const speaker = (await this.getMicphoneList()).find(
      (item) => item.name === name
    );
    logger.info("获取当前播麦克风", speaker);
    return speaker;
  }

  // 设置音频播放设备
  async setMicphone(name) {
    logger.info("设置音频设备", name);
    execSync(`LANG=en pactl set-default-source ${name}`);
  }

  // 设置音频播放设备音量
  async setMicphoneVolume(name, v) {
    logger.info("设置音频设备音量", name, v);
    execSync(`LANG=en pactl set-source-volume ${name} ${v}%`);
  }
}

module.exports = new Microphone();

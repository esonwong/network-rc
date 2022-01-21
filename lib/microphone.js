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
   * 麦克风列表
   */
  async getMicphoneList() {
    const output = execSync("pacmd list-sources").toString();

    const matchList = Array.from(
      output.matchAll(
        /index: (\d+)[\s\S]+?name: \<(.+?)\>[\s\S]+?volume: [\s\S]+?(\d+)\%[\s\S]+?alsa\.card_name = \"(.+?)\"/g
      )
    );

    const list = matchList.map(([, index, id, volume, name]) => ({
      index,
      id,
      name,
      volume,
    }));
    console.log("获取麦克风设备列表", list);
    return list;
  }
}

module.exports = new Microphone();

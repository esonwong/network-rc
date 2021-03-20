const util = require("util");
const exec = util.promisify(require("child_process").exec);
const EventEmitter = require("events");

class Updater extends EventEmitter {
  async update() {
    try {
      await this.download();
      await this.unTar();
    } catch (e) {
      console.error(e);
      this.emit("error");
    }
  }
  async download() {
    await exec(
      `wget https://network-rc.esonwong.com/download/network-rc.tar.gz /tmp/network-rc.tar.gz`
    );
    console.log("下载完成");
    this.emit("downloaded");
  }

  async unTar() {
    await exec(`tar -zxvf /tmp/network-rc.tar.gz ../`);
    console.log("解压完成");
    this.emit("untared");
  }
}

module.exports = new Updater();

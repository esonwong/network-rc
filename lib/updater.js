const util = require("util");
const exec = util.promisify(require("child_process").exec);
const EventEmitter = require("events");
const { join } = require("path");

class Updater extends EventEmitter {
  async update() {
    try {
      await this.download();
      await this.unTar();
      this.emit("updated");
      await this.restartService();
    } catch (e) {
      console.error(e);
      this.emit("error", e);
    }
  }
  async download() {
    this.emit("downloading");
    await exec(
      `wget -O /tmp/network-rc.tar.gz https://download.esonwong.com/network-rc/network-rc.tar.gz`
    );
    console.log("下载完成");
    this.emit("downloaded");
  }

  async unTar() {
    await exec(
      `tar -zxf /tmp/network-rc.tar.gz -C ${join(__dirname, "../../")}`
    );
    console.log("解压完成");
    this.emit("untared");
  }

  async restartService() {
    this.emit("before-restart");
    await exec(`sudo systemctl restart network-rc.service`);
    this.emit("restarted");
  }
}

module.exports = new Updater();


const spawn = require("child_process").spawn;
const { EventEmitter } = require('events')
const { asyncCommand } = require('./unit')
const { existsSync } = require("fs");
const path = require('path');

class AudioPlayer extends EventEmitter {
  constructor(options) {
    super(options)
    this.options = options
    this.list = []
    this.playing = false
  }

  push(data) {
    this.list.push(data);
    this.runPlay()
  }

  runPlay() {
    if (this.list.length < 1 || this.playing) return;
    this.play(this.list.shift())
  }

  async play({ type, data }) {
    console.log('play audio', type)
    this.playing = true
    let aplay

    switch (type) {
      case 'buffer':
        aplay = spawn("aplay", ["-c", 1, "-r", 48000, "-f", "S16_LE", '-']);
        aplay.stdin.write(data)
        break;
      case 'pcm file path':
        aplay = spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE", data]);
        break
      case 'mp3 file path':
        const mp3Path =  path.join(__dirname, data.path)
        console.log('mp3 path', mp3Path)
        if(!existsSync(mp3Path)){
          console.log(`${mp3Path} 不存在`)
          return
        }
        const filename = path.posix.basename(mp3Path);
        const pcmPath = `/tmp/audio/${filename.replace('mp3', 'pcm')}`
        if(!existsSync(pcmPath)){
          const cmd = `ffmpeg -i ${mp3Path} -f wav ${pcmPath}`
          console.log('mp3 转换 cmd', cmd)
          const result = await asyncCommand(cmd);
          console.log('mp3 转换', result)
        }
        aplay = spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE", pcmPath ]);
        break
      default:
        break;
    }

    aplay.stdin.on("close", () => {
      // console.error(`Audio plyaer stdin close.`);
    });
    aplay.stdin.on("finish", () => {
      console.error(`Audio plyaer stdin finish.`);
    });
    aplay.stdin.on("error", (e) => {
      aplay.kill()
      this.onWarnning && this.onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    });
    aplay.stderr.on('data', (data) => {
      console.error(`Audio plyaer stderr: ${data}`);
    });

    aplay.on('exit', (code) => {
      // console.log(`Audio plyaer exit`);
      setTimeout(() => {
        this.playing = false
        this.runPlay()
      }, 500)
    });
  }

  playMp3(path) {

  }

  volume(v) {

  }

  /**
   * ffmpeg 流转换
   */
  openFfmpeg() {
    this.ffmpeg = spawn("ffmpeg", [
      "-f",
      "wav",
      "-i",
      "pipe:",
      "-f",
      "wav",
      "-"
    ]);

    this.ffmpeg.stdin.on("error", (data) => {
      console.error(`Audio plyaer ffmpeg stdin error: ${data}`);
    })
    this.ffmpeg.stderr.on('data', (data) => {
      console.error(`Audio plyaer ffmpeg stderr: ${data}`);
    });
    this.ffmpeg.on('exit', (code) => {
      console.log(`Audio plyaer ffmpeg exit`);
    });

    this.ffmpeg.stdout.on('data', function (data) {
      console.error(`Audio plyaer ffmpeg stdout: ${data}`);
    });
  }
}

module.exports = new AudioPlayer();
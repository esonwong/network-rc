
const spawn = require("child_process").spawn;
const { EventEmitter } = require('events')

class AudioPlayer extends EventEmitter {
  constructor(options) {
    this.options = options
    this.list=[]
    this.playing = false
  }

  push(data){
    this.list.push(data);
    runPlay()
  }

  runPlay(){
    if(this.list.length <1 || this.playing) return;
    this.play(this.list.shift())
  }

  play(data, ) {
    let aplay
    if(typeof data === 'string'){
      spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE", data]);
    }else {
      spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE",'-']);
      aplay.stdin.write(buffer)
    }
    aplay.stdin.on("close", () => {
      console.error(`Audio plyaer stdin close.`);
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
      console.log(`Audio plyaer exit`);
      setTimeout(() => {
        this.runPlay()
      }, 200)
    });


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
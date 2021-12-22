const spawn = require("child_process").spawn;
const { EventEmitter } = require("events");
const { existsSync, createReadStream } = require("fs");
const path = require("path");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const PulseAudio = require("pulseaudio2");
const wav = require("wav");
const { execSync } = require("child_process");

class AudioPlayer extends EventEmitter {
  constructor(options) {
    super(options);
    this.options = options;
    this.list = [];
    this.playing = false;

    const context = new PulseAudio();

    context.on("state", function (state) {
      console.log("PulseAudio state:", state);
    });

    context.on("error", (err) => {
      console.error("PulseAudio error:", err);
    });

    this.pulse = context;
  }

  push(data) {
    this.list.push(data);
    this.runPlay();
  }

  async playFile(file) {
    console.log("mp3 path", file);
    if (!existsSync(file)) {
      console.log(`${file} 不存在`);
      this.playing = false;
      return;
    }
    const filename = path.posix.basename(file);
    const wavPath = `/tmp/${filename.replace("mp3", "wav")}`;
    if (!existsSync(wavPath)) {
      const cmd = `ffmpeg -i "${file}" -f wav "${wavPath}"`;
      console.log("mp3 转换 cmd", cmd);
      try {
        await execSync(cmd);
      } catch (e) {
        console.log("mp3 转换失败", e);
      }
    }
    this.playWav(wavPath);
  }

  playWav(path) {
    try {
      console.log("Play wav", path);

      const reader = new wav.Reader();
      createReadStream(path).pipe(reader);

      reader.pause();
      reader.on("format", (fmt) => {
        console.log(fmt);
        const opts = {
          channels: fmt.channels,
          rate: fmt.sampleRate,
          format: (fmt.signed ? "S" : "U") + fmt.bitDepth + fmt.endianness,
          latency: 50000, // in us
        };
        const play = this.pulse.createPlaybackStream(opts);

        let duration = 0;
        reader.on("data", (data) => {
          play.write(data);
          duration +=
            data.length / ((fmt.bitDepth / 8) * fmt.sampleRate * fmt.channels);
        });
        reader.on("end", () => {
          setTimeout(() => {
            play.end();
          }, duration * 1000);
        });
        reader.resume();
      });
    } catch (e) {
      console.log("Play wav error", e);
    }
  }

  createStreamPlayer({ sampleRate, channelCount, bitsPerSample }) {
    console.info("createStreamPlayer", {
      sampleRate,
      channelCount,
      bitsPerSample,
    });
    const opts = {
      channels: channelCount,
      rate: sampleRate,
      format: `${channelCount === 1 ? "S" : "U"}${bitsPerSample}_LE`,
      latency: 50000, // in us
    };
    const player = this.pulse.createPlaybackStream(opts);
    player.on("close", () => {
      console.log("Audio stream player close");
    });
    return player;
  }

  runPlay() {
    if (this.list.length < 1 || this.playing) return;
    this.play(this.list.shift());
  }

  async play({ type, data }) {
    console.log("play audio", type);
    this.playing = true;
    let aplay;

    switch (type) {
      case "buffer":
        aplay = spawn("aplay", ["-c", 1, "-r", 48000, "-f", "S16_LE", "-"]);
        aplay.stdin.write(data);
        break;
      case "pcm file path":
        this.playWav(data);
        return;
      case "wav file path":
        this.playWav(data);
        return;
      // aplay = spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE", data]);
      case "mp3 file path":
        this.playFile(data);
        return;
      // aplay = spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE", pcmPath]);
      default:
        break;
    }

    this.aplay = aplay;

    aplay.stdin.on("close", () => {
      // console.error(`Audio plyaer stdin close.`);
    });
    aplay.stdin.on("finish", () => {
      console.error(`Audio plyaer stdin finish.`);
    });
    aplay.stdin.on("error", (e) => {
      aplay.kill();
      this.onWarnning &&
        this.onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"));
    });
    aplay.stderr.on("data", (data) => {
      console.error(`Audio plyaer stderr: ${data}`);
    });

    aplay.on("exit", (code) => {
      console.log(`Audio plyaer exit`);
      setTimeout(() => {
        this.playing = false;
        this.runPlay();
      }, 500);
    });
  }

  stop() {
    this.list = [];
    this.aplay && this.aplay.kill();
  }

  async volume(v) {
    console.log("设置音量", v);
    await exec(`amixer -M set Master ${v}%`);
    this.getVolume();
  }

  async getVolume() {
    try {
      const { stdout, stderr } = await exec("amixer -M get Master");
      const match = /\[(\d+)\%\]/gi.exec(stdout);
      if (match) {
        let volume = match[1] - 0;
        volume = volume <= 1 ? 0 : volume;
        console.log("音量大小", volume);
        this.emit("volume", volume);
        return volume;
      } else {
        console.error("获取音量失败！", stdout);
        console.error("stderr", stderr);
        return 0;
      }
    } catch (e) {
      console.error("Getting volume error");
      console.error(e);
      return 0;
    }
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
      "-",
    ]);

    this.ffmpeg.stdin.on("error", (data) => {
      console.error(`Audio plyaer ffmpeg stdin error: ${data}`);
    });
    this.ffmpeg.stderr.on("data", (data) => {
      // console.error(`Audio plyaer ffmpeg stderr: ${data}`);
    });
    this.ffmpeg.on("exit", (code) => {
      console.log(`Audio plyaer ffmpeg exit`);
    });

    this.ffmpeg.stdout.on("data", function (data) {
      console.error(`Audio plyaer ffmpeg stdout: ${data}`);
    });
  }
}

module.exports = new AudioPlayer();

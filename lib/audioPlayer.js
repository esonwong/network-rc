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
    this.getSpeakerList();
    this.playing = false;

    execSync("pulseaudio --start");
    console.info(`pulseaudio: 已启动`);
    const context = new PulseAudio();

    context.on("state", function (state) {
      console.log("PulseAudio state:", state);
    });
    context.on("error", (err) => {
      console.error("PulseAudio error:", err);
    });

    this.pulse = context;
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

  // 获取音频播放设备列表
  async getSpeakerList() {
    const output = execSync("pactl list sinks").toString();

    const matchList = Array.from(
      output.matchAll(
        /Sink #(\d+)[\s\S]+?Name: (.+)[\s\S]+?Description: (.+)[\s\S]+?Volume: [\s\S]+?(\d+)\%/g
      )
    );

    const list = matchList.map(([, index, name, description, volume]) => ({
      index,
      displayName: description,
      name,
      volume,
      description,
    }));

    console.log("获取音频设备列表", list);
    this.list = list;
    return list;
  }

  // 获取当前播放设备
  async getSpeaker() {
    const output = execSync("pactl info").toString();
    const [, name] = output.match(/Default Sink: (.+?)\n/);
    console.log("获取当前播放设备", name);
    const speaker = (await this.getSpeakerList()).find(
      (item) => item.name === name
    );
    console.log("获取当前播放设备", speaker);
    return speaker;
  }

  // 设置音频播放设备
  async setSpeaker(name) {
    console.log("设置音频设备", name);
    execSync(`pactl set-default-sink ${name}`);
  }

  // 设置音频播放设备音量
  async setSpeakerVolume(name, v) {
    console.log("设置音频设备音量", name, v);
    execSync(`pactl set-sink-volume ${name} ${v}%`);
  }

  micphoneVolume(v) {
    console.log("设置麦克风音量", v);
    exec(`amixer -M set Capture ${v}%`);
    this.getMicphoneVolume();
  }

  async getMicphoneVolume() {
    try {
      const output = execSync("amixer -M get Capture").toString();
      const match = /\[(\d+)\%\]/gi.exec(output);
      if (match) {
        let volume = match[1] - 0;
        volume = volume <= 1 ? 0 : volume;
        console.log("麦克风音量大小", volume);
        this.emit("volume", volume);
        return volume;
      } else {
        console.error("获取麦克风音量失败！", stdout);
        console.error("stderr", stderr);
        return 0;
      }
    } catch (e) {
      console.error("Getting micphone volume error", e);
    }
  }
}

module.exports = new AudioPlayer();

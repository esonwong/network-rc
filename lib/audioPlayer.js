const { EventEmitter } = require("events");
const { existsSync, createReadStream } = require("fs");
const path = require("path");
const PulseAudio = require("pulseaudio2");
const wav = require("wav");
const { execSync } = require("child_process");

class AudioPlayer extends EventEmitter {
  constructor(options) {
    super(options);
    this.options = options;
    this.audioList = [];
    this.getSpeakerList();
    this.playing = false;

    execSync("pulseaudio --start -D");
    console.info(`pulseaudio: 已启动`);
    const context = new PulseAudio();

    context.on("state", async (state) => {
      logger.info("PulseAudio state:", state);
      if (state === "ready") {
        this.emit("ready");
        // const list = await context.sink();
        // logger.info("PulseAudio sink list:", list);
      }
    });
    context.on("error", (err) => {
      logger.info(`PulseAudio error ${err}`);
    });

    this.pulse = context;
  }

  stopAll() {
    logger.info("stopAll", this.audioList);
    this.audioList.forEach((item) => item.stop());
  }

  async playFile(filePath, stop = false) {
    if (stop) {
      this.stopAll();
    }
    if (!filePath) return;
    logger.info("mp3 path", filePath);
    if (!existsSync(filePath)) {
      logger.info(`${filePath} 不存在`);
      this.playing = false;
      return;
    }
    const filename = path.posix.basename(filePath);
    const wavPath = `/tmp/${filename.replace("mp3", "wav")}`;
    if (!existsSync(wavPath)) {
      const cmd = `ffmpeg -i "${filePath}" -f wav "${wavPath}"`;
      logger.info("mp3 转换 cmd", cmd);
      try {
        execSync(cmd);
      } catch (e) {
        logger.info("mp3 转换失败", e);
      }
    }
    return this.playWav(wavPath);
  }

  playWav(path) {
    try {
      logger.info("Play wav", path);

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

        const end = new Promise((resolve) => {
          reader.on("end", () => {
            setTimeout(() => {
              play.end();
              resolve();
              reader.emit("playEnd");
            }, duration * 1000);
          });
          reader.resume();
        });

        const audio = {
          stop() {
            play.stop();
          },
          end,
        };
        this.audioList.push(audio);
        reader.on("playEnd", () => {
          this.audioList = this.audioList.filter((item) => item !== audio);
        });
        return audio;
      });
    } catch (e) {
      logger.info("Play wav error", e);
    }
  }

  createStreamPlayer({
    sampleRate,
    channelCount,
    bitsPerSample,
    label = "Audio stream player",
  }) {
    console.info("createStreamPlayer", {
      label,
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
      logger.info(`${label} close`);
    });
    return player;
  }

  /**
   * 获取音频播放设备列表
   */
  async getSpeakerList() {
    const output = execSync("LANG=en pactl list sinks").toString();

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

    logger.info("获取音频设备列表", list);
    this.list = list;
    return list;
  }

  // 获取当前播放设备
  async getSpeaker() {
    const output = execSync("LANG=en pactl info").toString();
    const [, name] = output.match(/Default Sink: (.+?)\n/) || [];
    logger.info("获取当前播放设备", name);
    const speaker = (await this.getSpeakerList()).find(
      (item) => item.name === name
    );
    logger.info("获取当前播放设备", speaker);
    return speaker;
  }

  // 设置音频播放设备
  async setSpeaker(name) {
    logger.info("设置音频设备", name);
    execSync(`LANG=en pactl set-default-sink ${name}`);
  }

  // 设置音频播放设备音量
  async setSpeakerVolume(name, v) {
    logger.info("设置音频设备音量", name, v);
    execSync(`LANG=en pactl set-sink-volume ${name} ${v}%`);
  }

  destroy() {
    this.pulse.end();
  }
}

module.exports = new AudioPlayer();

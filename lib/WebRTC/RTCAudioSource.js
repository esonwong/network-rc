const { RTCAudioSource } = require("wrtc").nonstandard;
const ffmpeg = require("fluent-ffmpeg");

const sampleRate = 48000;

class NodeWebRtcAudioSource extends RTCAudioSource {
  constructor() {
    super();
    this.command = null;
    this.cache = Buffer.alloc(0);
  }

  createTrack() {
    const track = super.createTrack();
    // if (this.command === null) {
    //   this.start();
    // }
    return track;
  }

  async start() {
    if (this.command !== null) {
      this.stop();
    }
    logger.info("WebRTC Audio Microphone Start");

    this.command = ffmpeg("default")
      .inputFormat("pulse")
      .audioChannels(1)
      .audioFrequency(sampleRate)
      .audioCodec("pcm_s16le")
      .outputFormat("s16le")
      .on("start", () => {
        logger.info("WebRTC Audio Microphone Open");
      })
      .on("error", function (err) {
        logger.info("WebRTC Audio Microphone: error" + err.message);
      })
      .on("stderr", function (stderrLine) {
        // logger.info("WebRTC Audio Microphone stderr output: " + stderrLine);
      })
      .on("end", function () {
        logger.info("WebRTC Audio Microphone processing finished !");
      });

    this.ffstream = this.command.pipe();
    this.ffstream.on("data", (buffer) => {
      // logger.info("Video ffmpeg data length", buffer.length);
      this.cache = Buffer.concat([this.cache, buffer]);
    });
    this.ffstream.on("drain", () => {
      logger.info("WebRTC Audio Microphone  stream drain");
    });
    this.ffstream.on("error", () => {
      logger.info("WebRTC Audio Microphone stream error");
    });
    this.ffstream.on("finish", () => {
      logger.info("WebRTC Audio Microphone stream finish");
    });

    const processData = () => {
      while (this.cache.length > 960) {
        const buffer = this.cache.slice(0, 960);
        this.cache = this.cache.slice(960);
        const samples = new Int16Array(new Uint8Array(buffer).buffer);
        this.onData({
          bitsPerSample: 16,
          sampleRate,
          channelCount: 1,
          numberOfFrames: samples.length,
          type: "data",
          samples,
        });
      }
      if (this.command !== null) {
        setTimeout(() => processData(), 10);
      }
    };
    processData();
  }

  stop() {
    if (this.command !== null) {
      logger.info("WebRTC Audio Source stop");
      this.command.kill("SIGHUP");
      this.command = null;
    }
  }
}

module.exports = NodeWebRtcAudioSource;

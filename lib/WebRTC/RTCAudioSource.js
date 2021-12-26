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
    console.log("WebRTC Audio Microphone Start");
    // this.command = exec(
    //   `ffmpeg -f alsa -i default -ar 48000 -ac 1 -acodec pcm_s16le -f s16le -`
    // );

    // this.command.on("close", () => {
    //   console.log("WebRTC Audio Microphone ffmpeg close");
    // });

    // this.command.stderr.on("data", (data) => {
    //   console.log("WebRTC Audio Microphone ffmpeg stderr", data.toString());
    // });

    // const streamer = this.command.stdout.pipe(new Splitter());
    // streamer.on("data", (buffer) => {
    //   this.cache = Buffer.concat([this.cache, buffer]);
    // });

    // this.command.on("drain", () => {
    //   console.log("WebRTC Audio Microphone stream drain");
    // });
    // this.command.on("error", (e) => {
    //   console.error("WebRTC Audio Microphone stream error", e);
    // });
    // this.command.on("finish", () => {
    //   console.log("WebRTC Audio Microphone stream finish");
    // });

    this.command = ffmpeg("default")
      .inputFormat("alsa")
      .audioChannels(1)
      .audioFrequency(sampleRate)
      .audioCodec("pcm_s16le")
      .outputFormat("s16le")
      .on("start", () => {
        console.log("WebRTC Audio Microphone Open");
      })
      .on("error", function (err) {
        console.log("WebRTC Audio Microphone: error" + err.message);
      })
      .on("stderr", function (stderrLine) {
        // console.log("WebRTC Audio Microphone stderr output: " + stderrLine);
      })
      .on("end", function () {
        console.log("WebRTC Audio Microphone processing finished !");
      });

    this.ffstream = this.command.pipe();
    this.ffstream.on("data", (buffer) => {
      // console.log("Video ffmpeg data length", buffer.length);
      this.cache = Buffer.concat([this.cache, buffer]);
    });
    this.ffstream.on("drain", () => {
      console.log("WebRTC Audio Microphone  stream drain");
    });
    this.ffstream.on("error", () => {
      console.log("WebRTC Audio Microphone stream error");
    });
    this.ffstream.on("finish", () => {
      console.log("WebRTC Audio Microphone stream finish");
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
    console.log("WebRTC Audio Source stop");
    if (this.command !== null) {
      this.command.kill("SIGHUP");
      this.command = null;
    }
  }
}

module.exports = NodeWebRtcAudioSource;

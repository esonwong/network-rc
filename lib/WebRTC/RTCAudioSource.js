const { RTCAudioSource } = require('wrtc').nonstandard;
const ffmpeg = require('fluent-ffmpeg')


class NodeWebRtcAudioSource extends RTCAudioSource {
  constructor() {
    super()
    this.command = null
    this.cache = Buffer.alloc(0)
  }

  createTrack() {
    const track = super.createTrack()
    if (this.command === null) {
      this.start()
    }
    return track
  }

  async start() {
    if (this.command !== null) {
      this.stop();
    }
    console.log("Audio source start");
    this.command = ffmpeg("plughw:1,0")
      .inputFormat("alsa").audioChannels(1).audioFrequency(48000)
      .audioCodec("pcm_s16le").outputFormat("s16le")
      .on('start', () => {
        console.log('Audio processing start !');
      })
      .on('error', function (err) {
        // console.log('Audio processing an error occurred: ' + err.message);
      })
      // .on('stderr', function (stderrLine) {
      //   console.log('Audio source processing stderr output: ' + stderrLine);
      // })
      .on('end', function () {
        console.log('Audio processing finished !');
      });

    this.ffstream = this.command.pipe();
    this.ffstream.on('data', (buffer) => {
      // console.log("Video ffmpeg data length", buffer.length);
      this.cache = Buffer.concat([this.cache, buffer])
    });
    this.ffstream.on('drain', () => {
      console.log("Audio stream drain");
    })
    this.ffstream.on('error', () => {
      console.log("Audio stream error");
    })
    this.ffstream.on('finish', () => {
      console.log("Audio stream finish");
    })

    const processData = () => {
      while (this.cache.length > 960) {
        const buffer = this.cache.slice(0, 960)
        this.cache = this.cache.slice(960)
        const samples = new Int16Array(new Uint8Array(buffer).buffer)
        this.onData({
          bitsPerSample: 16,
          sampleRate: 48000,
          channelCount: 1,
          numberOfFrames: samples.length,
          type: 'data',
          samples
        })
      }
      if (this.command !== null) {
        setTimeout(() => processData(), 10)
      }
    }
    processData()
  }

  stop() {
    console.log("Audio source stop");
    if (this.command !== null) {
      this.command.kill("SIGHUP")
      this.command = null
    }
  }
}

module.exports = NodeWebRtcAudioSource
const { RTCAudioSource } = require('wrtc').nonstandard;
const { spawn } = require('child_process');


class NodeWebRtcAudioSource extends RTCAudioSource {
  constructor() {
    super()
    this.ps = null
    this.cache = Buffer.alloc(0)
  }

  createTrack() {
    const track = super.createTrack()
    if (this.ps === null) {
      this.start()
    }
    return track
  }

  async start() {
    if (this.ps !== null) {
      this.stop();
    }
    try {
      console.log("Audio source start");
      this.ps = spawn('ffmpeg', ['-nostdin', '-f', 'alsa', '-i', `plughw:1,0`,
        '-ac', 1, '-ar', 48000, '-f', 's16le', '-acodec', 'pcm_s16le', '-'])
      this.ps.on("error", (e) => {
        console.error(e);
      })
      this.ps.on("message", (m) => {
        console.error(m);
      })
      this.ps.on("exit", () => {
        console.log("Audio ffmpeg exit");
      })

      this.ps.on("close", () => {
        console.log("Audio ffmpeg close");
      })
    } catch (error) {
      throw error;
    }



    this.ps.stdout.on('data', buffer => {
      this.cache = Buffer.concat([this.cache, buffer])
    })

    // this.ps.stdout.on('drain', buffer => {
    //   console.log("Audio stream drain");
      
    // })
    // this.ps.stdout.on('error', buffer => {
    //   console.log("Audio stream error");
    // })
    // this.ps.stdout.on('finish', buffer => {
    //   console.log("Audio stream finish");
    // })

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
      if (this.ps !== null) {
        setTimeout(() => processData(), 10)
      }
    }
    processData()
  }

  stop() {
    console.log("Audio source stop");
    if (this.ps !== null) {
      this.ps.kill('SIGTERM')
      this.ps = null
    }
  }
}

module.exports = NodeWebRtcAudioSource
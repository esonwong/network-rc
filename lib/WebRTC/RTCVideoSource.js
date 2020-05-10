const { RTCVideoSource } = require('wrtc').nonstandard;
const ffmpeg = require('fluent-ffmpeg')

class NodeWebRtcAudioSource extends RTCVideoSource {
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
      this.stop() // stop existing process
    }

    console.log("Video source stop");
    const width = 400, height = 226;

    this.command = ffmpeg('default') // See above article
      // Set input format (depends on OS, will not work if this isn't correct!)
      .inputFormat('avfoundation')
      .inputFPS(30)
      // Set output format
      // .format('mp4')
      // Set size
      .size(`${width}x${height}`)
      // Record stream for 15sec
      // .save('camera-recording.mp4');
      .outputOptions(['-pix_fmt yuv420p'])
      .format("rawvideo")
      .on('start', () => {
        console.log('Processing start !');
      })
      .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
      })
      .on('stderr', function (stderrLine) {
        // console.log('Stderr output: ' + stderrLine);
      })
      .on('end', function () {
        console.log('Processing finished !');
      });

    this.ffstream = this.command.pipe();
    this.ffstream.on('data', (buffer) => {
      // console.log("Video ffmpeg data length", buffer.length);
      this.cache = Buffer.concat([this.cache, buffer])
    });

    this.ffstream.on('drain', () => {
      console.log("Video stream drain");

    })
    this.ffstream.on('error', () => {
      console.log("Video stream error");
    })
    this.ffstream.on('finish', () => {
      console.log("Video stream finish");
    })

    const frameSize = width * height * 1.5;
    const processData = () => {
      while (this.cache.length > frameSize) {
        const buffer = this.cache.slice(0, frameSize)
        this.cache = this.cache.slice(frameSize)
        this.onFrame({
          width,
          height,
          data: new Uint8ClampedArray(buffer)
        })
      }
      if (this.command !== null) {
        setTimeout(() => processData())
      }
    }
    processData()

  }

  stop() {
    console.log("Video source stop");
    if (this.command !== null) {
      this.command.kill();
      this.command = null
    }
  }
}

module.exports = NodeWebRtcAudioSource
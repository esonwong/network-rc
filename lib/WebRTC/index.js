const { RTCPeerConnection, RTCIceCandidate, MediaStream, nonstandard: { RTCAudioSink, RTCVideoSink } } = require('wrtc');
const { PassThrough } = require('stream');
const RTCAudioSource = require('./RTCAudioSource');
const RTCVideoSource = require('./RTCVideoSource');
const { spawn } = require('child_process');
const { StreamInput } = require('fluent-ffmpeg-multistream');
const ffmpeg = require('fluent-ffmpeg')


module.exports = class WebRTC {
  constructor({ socket, onCandidate, onOffer }) {

    this.socket = socket;

    console.log("ws 连接");

    // # 1 创建服务器端 rc
    console.log("Webrtc start!");
    const rc = new RTCPeerConnection({
      sdpSemantics: 'unified-plan',
      iceServers: [
        {
          urls: 'stun:global.stun.twilio.com:3478?transport=udp'
        },
        {
          urls: 'stun:stun.l.google.com:19302'
        },
      ],
    });

    this.rc = rc;


    // # 2 添加媒体
    const mediaStream = new MediaStream();
    this.rtcVideoSource = new RTCVideoSource();
    this.rtcAudioSource = new RTCAudioSource();
    const videoTrack = this.rtcVideoSource.createTrack();
    const audioTrack = this.rtcAudioSource.createTrack();
    mediaStream.addTrack(videoTrack);
    mediaStream.addTrack(audioTrack);
    rc.addTrack(videoTrack, mediaStream);
    rc.addTrack(audioTrack, mediaStream);

    rc.ontrack = rc.ontrack = (e) => {
      const audioSink = new RTCAudioSink(e.track);
      const stream = new PassThrough();
      this.audioStream = stream;
      const onAudioData = (data) => {
        console.log(data);

        stream.push(Buffer.from(data.samples.buffer))
      };
      audioSink.addEventListener('data', onAudioData);
      stream.on('end', () => {
        audioSink.removeEventListener('data', onAudioData);
      });
      const proc = ffmpeg()
        .addInput((new StreamInput(stream)).url)
        .addInputOptions([
          '-f s16le',
          '-ar 48k',
          '-ac 1',
        ])
        .on('start', () => {
          console.log('Start recording >> ')
        })
        .on('end', () => {
          console.log('Stop recording >> ')
        })
        .output("test.wav");

      proc.run();
    }

    rc.addEventListener("icecandidate", ({ candidate }) => {
      if (!candidate) return;
      onCandidate(candidate);
      console.log("local candidate ", candidate.candidate);
    });

    rc.addEventListener("iceconnectionstatechange", function (e) {
      console.log("iceConnectionState", rc.iceConnectionState)
    });



    (async () => {
      // # 3 服务器 设置服务器本地 description
      const offer = await rc.createOffer({
        offerToReceiveAudio: true
      });
      await rc.setLocalDescription(offer);
      onOffer(offer);
    })();

  }

  onCandidate(candidate) {
    if (!candidate) return;
    console.log("remote candidate", candidate.candidate);
    this.rc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  onAnswer(description) {
    // # 8 服务器 设置远程 description
    this.rc.setRemoteDescription(description);
  }

  close() {
    console.log("Webrtc close!");
    this.rtcAudioSource.stop();
    this.rtcVideoSource.stop();
    // this.audioStream.end();
    this.rc.close();
  }
};

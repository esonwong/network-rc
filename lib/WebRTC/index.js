const { RTCPeerConnection, RTCIceCandidate, MediaStream, nonstandard: { RTCAudioSink } } = require('wrtc');
const RTCAudioSource = require('./RTCAudioSource');
const RTCVideoSource = require('./RTCVideoSource');
const { spawn } = require('child_process');


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
    this.onAudioData = (data) => {
      if (!this.playerCommand) return;
      this.playerCommand.stdin.write(Buffer.from(data.samples.buffer))
    }


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
      console.log("Audio plyaer open");
      const playerCommand = spawn("aplay", ["-c", 1, "-r", 48000, "-f", "S16_LE"]);
      this.playerCommand = playerCommand;
      // playerCommand.stdout.on('data', (data) => {
      //   console.log(`Audio plyaer stdout: ${data}`);
      // });
      // playerCommand.stderr.on('data', (data) => {
      //   console.error(`Audio plyaer stderr: ${data}`);
      // });
      playerCommand.on('close', (code) => {
        // console.log(`Audio plyaer 子进程退出，退出码 ${code}`);
        this.audioSink.removeEventListener(this.onAudioData);
      });
      const audioSink = new RTCAudioSink(e.track);
      this.audioSink = audioSink;
      audioSink.addEventListener('data', this.onAudioData);
    }

    rc.addEventListener("icecandidate", ({ candidate }) => {
      if (!candidate) return;
      onCandidate(candidate);
      // console.log("local candidate ", candidate.candidate);
    });

    rc.addEventListener("iceconnectionstatechange", (e) => {
      console.log("iceConnectionState", rc.iceConnectionState)
      if (rc.iceConnectionState == "failed") {
        this.close();
      }
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
    this.audioSink.stop();
    if (this.playerCommand) {
      console.log("Audio plyaer close");
      this.playerCommand.kill("SIGHUP");
      this.playerCommand = null;
    }
    this.rc.close();
  }
};

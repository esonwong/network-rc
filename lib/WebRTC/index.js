const { RTCPeerConnection, RTCIceCandidate, MediaStream, nonstandard: { RTCAudioSink } } = require('wrtc');
const RTCAudioSource = require('./RTCAudioSource');
const RTCVideoSource = require('./RTCVideoSource');
const { spawn } = require('child_process');


module.exports = class WebRTC {
  constructor({ socket, onCandidate, onOffer, onClose, onWarnning, onError, onSuccess }) {

    this.socket = socket;
    this.onClose = onClose;

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
        {
          urls: "turn:us.esonwong.com",
          username: "eson",
          credential: "networkrc"
        }
      ],
    });

    this.rc = rc;
    this.onAudioData = (data) => {
      if (!this.playerCommand) return;
      this.playerCommand.stdin.write(Buffer.from(data.samples.buffer))
    }


    // # 2 添加媒体
    const mediaStream = new MediaStream();
    this.mediaStream = mediaStream;
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
      playerCommand.stdin.on("close", () => {
        console.error(`Audio plyaer stdin close.`);
      });
      playerCommand.stdin.on("finish", () => {
        console.error(`Audio plyaer stdin finish.`);
      });
      playerCommand.stdin.on("error", (e) => {
        // console.error(`Audio plyaer error`, e);
        onWarnning && onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
        this.audioSink.removeEventListener(this.onAudioData);
        this.closeAudioPlayer();
      });
      playerCommand.stderr.on('data', (data) => {
        console.error(`Audio plyaer stderr: ${data}`);
        // onError(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
      });

      playerCommand.on('exit', (code) => {
        console.log(`Audio plyaer exit`);
        this.audioSink.removeEventListener(this.onAudioData);
      });
      const audioSink = new RTCAudioSink(e.track);
      this.audioSink = audioSink;
      audioSink.addEventListener('data', this.onAudioData);
    }

    rc.addEventListener("icecandidate", ({ candidate }) => {
      if (!candidate) return;
      onCandidate(candidate);
      console.log("local candidate ", candidate.candidate);
    });

    rc.addEventListener("iceconnectionstatechange", (e) => {
      console.log("iceConnectionState", rc.iceConnectionState)
      if (rc.iceConnectionState == "failed") {
        // this.close();
        onError(new Error(" WebRTC 连接失败！"))
      }
    });

    rc.addEventListener("connectionstatechange", () => {
      console.log("Connection state change", rc.connectionState);
      if (rc.connectionState === "connected") {
        onSuccess();
      }
      if (rc.connectionState === "disconnected") {
        // this.close();
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
    // console.log("remote candidate", candidate.candidate);
    this.rc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  onAnswer(description) {
    // # 8 服务器 设置远程 description
    this.rc.setRemoteDescription(description);
  }

  openCamera(enabled) {
    console.log("Webrtc camera", enabled);

    this.mediaStream.getTracks().forEach(track => {
      track.enabled = enabled;
    })
  }

  closeAudioPlayer() {
    if (this.playerCommand) {
      console.log("Audio plyaer close");
      this.playerCommand.kill("SIGHUP");
      this.playerCommand = null;
    }
  }

  close() {
    if (!this.rc) return;
    console.log("Webrtc close!");
    this.rtcAudioSource.stop();
    this.rtcVideoSource.stop();
    this.audioSink && this.audioSink.stop();
    this.closeAudioPlayer();
    this.rc.close();
    this.rc = undefined;
    this.onClose();
  }
};

const { RTCPeerConnection, RTCIceCandidate, MediaStream } = require('wrtc');
const RTCAudioSource = require('./RTCAudioSource');
const RTCVideoSource = require('./RTCVideoSource');


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
    this.candidateList = [];


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

    rc.addEventListener("icecandidate", ({ candidate }) => {
      if (!candidate) return;
      this.candidateList.push(candidate);
      console.log("local candidate ", candidate.candidate);
    });

    rc.addEventListener("iceconnectionstatechange", function (e) {
      console.log("iceConnectionState", rc.iceConnectionState)
    });

    (async () => {
      // # 3 服务器 设置服务器本地 description
      const offer = await rc.createOffer();
      await rc.setLocalDescription(offer);
      onOffer(offer);
      this.candidateList.forEach(candidate => {
        onCandidate(candidate);
      })
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
    this.rc.close();
  }
};

const { RTCPeerConnection, RTCIceCandidate, MediaStream } = require('wrtc');
const RTCAudioSource = require('./RTCAudioSource');
const RTCVideoSource = require('./RTCVideoSource');

moudle.exports = class WebRTC {
  constructor({ socket }) {

    this.socket = socket;

    console.log("ws 连接");

    // # 1 创建服务器端 rc
    const rc = new RTCPeerConnection({
      // sdpSemantics: 'unified-plan',
      iceServers: [
        {
          urls: 'stun:global.stun.twilio.com:3478?transport=udp'
        },
        {
          urls: 'stun:stun.l.google.com:19302'
        },
      ],
    });


    // # 2 添加媒体
    const mediaStream = new MediaStream();
    const rtcAudioSource = new RTCAudioSource();
    const rtcVideoSource = new RTCVideoSource();
    const audioTrack = rtcAudioSource.createTrack();
    const videoTrack = rtcVideoSource.createTrack();
    mediaStream.addTrack(audioTrack);
    mediaStream.addTrack(videoTrack);
    rc.addTrack(audioTrack, mediaStream);
    rc.addTrack(videoTrack, mediaStream);

    rc.addEventListener("icecandidate", function ({ candidate }) {
      if (!candidate) return;
      this.socketSend({ type: "candidate", data: candidate });
      console.log("local candidate ", candidate.candidate);
    });

    rc.addEventListener("iceconnectionstatechange", function (e) {
      console.log("iceConnectionState", rc.iceConnectionState)
    })

    // # 3 服务器 设置服务器本地 description
    const offer = await rc.createOffer();
    await rc.setLocalDescription(offer);
    this.socketSend({ type: "offer", data: offer });
    this.socket.on('message', onSocketMessage);
  }



  socketSend(type, payload) {
    this.socket.send(JSON.stringify({
      action: `webrtc ${type}`,
      payload
    }))
  }

  onSocketMessage({ data }) {
    if (typeof data !== "string") return;
    data = JSON.parse(data);
    const { action, payload } = data;
    if (action.indexOf("webrtc") === -1) return;
    // eslint-disable-next-line
    const [_, type] = action.split(" ");
    switch (type) {
      case "candidate":
        this.onCandidate(payload)
        break;
      case "answer":
        this.onAnser(payload)
      case "close":
        this.close(payload)
      default:
        console.log(action)
        break;
    }
  }

  onCandidate(candidate) {
    console.log("remote candidate", candidate.candidate);
    rc.addIceCandidate(new RTCIceCandidate(candidate))
  }

  onAnser(description) {
    // # 8 服务器 设置远程 description
    rc.setRemoteDescription(description);
  }

  close() {
    rtcAudioSource.stop();
    rtcVideoSource.stop();
    rc.close();
  }
};

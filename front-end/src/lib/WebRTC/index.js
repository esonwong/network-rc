import { message } from "antd";

export default class WebRTC {
  constructor({
    video,
    micphoneEanbled = false,
    socket,
    onSuccess,
    onClose,
    onDataChannel,
  }) {
    this.video = video;
    this.socket = socket;
    this.onSuccess = onSuccess;
    this.onClose = onClose;
    this.onDataChannel = onDataChannel;
    this.micphoneEanbled = micphoneEanbled;

    // #0 请求 webrtc 连接
    this.socketSend({ type: "connect" });
    this.socket.addEventListener("message", this.onSocketMessage);

    this.audioEl = document.createElement("audio");
    document.body.appendChild(this.audioEl);
  }

  socketSend({ type, payload }) {
    this.socket.send(
      JSON.stringify({
        action: `webrtc ${type}`,
        payload,
      })
    );
  }

  onSocketMessage = ({ data }) => {
    if (typeof data !== "string") return;
    data = JSON.parse(data);
    const { action, payload } = data;
    if (action.indexOf("webrtc") === -1) return;
    const type = action.split(" ")[1];
    switch (type) {
      case "offer":
        this.onOffer(payload);
        break;
      case "candidate":
        this.addCandidate(payload);
        break;
      default:
        console.log(action);
        break;
    }
  };

  onOffer = async (offer) => {
    console.log("WebRTC Get offer", offer);

    // # 4 创建客户端 rc
    const rc = new RTCPeerConnection({
      // iceTransportPolicy: "relay",
      // sdpSemantics: 'unified-plan',
      iceServers: [
        {
          urls: "stun:gz.esonwong.com:3478",
          username: "eson",
          credential: "networkrc",
        },
        { urls: ["stun:turn2.l.google.com"] },
        {
          urls: "stun:stun.miwifi.com",
        },
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    rc.addEventListener("datachannel", ({ channel }) => {
      const { label } = channel;
      console.log(`WebRTC [${label}] Data Channel open`, channel);
      this.onDataChannel(channel);
    });

    rc.addEventListener("connectionstatechange", ({ target }) => {
      console.log("Connection state change", target.connectionState);
      if (target.connectionState === "connected") {
        this?.onSuccess?.({});
        console.log("RTC", rc);
      }
      if (target.connectionState === "disconnected") {
        this.close();
      }
    });
    rc.addEventListener("iceconnectionstatechange", function (e) {
      // console.log("iceConnectionState", e);
    });
    rc.addEventListener("icecandidate", ({ candidate }) => {
      if (!candidate) return;
      this.socketSend({ type: "candidate", payload: candidate });
      // console.log("local candidate", candidate);
    });
    rc.addEventListener("icecandidateerror", function (e) {
      console.error("icecandidateerror", e);
    });

    this.rc = rc;

    // # 5 设置客户端远程 description
    await rc.setRemoteDescription(offer);

    // # 6 获取远程 stream
    console.log("receivers", rc.getReceivers());
    const remoteStream = new MediaStream(
      rc.getReceivers().map((receiver) => receiver.track)
    );

    this.audioEl.srcObject = remoteStream;
    // this.video.srcObject = remoteStream;

    await this.addAudioTrack();

    // # 7 设置客户端本地 description 传递本地回答详情
    const answer = await rc.createAnswer();
    console.log("WebRTC answer", answer);
    await rc.setLocalDescription(answer);
    this.socketSend({ type: "answer", payload: answer });
  };

  addCandidate(candidate) {
    if (!candidate) return;
    // console.log("remote candidate", candidate.candidate);
    this.rc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  playAudio(playing) {
    playing ? this.audioEl.play() : this.audioEl.pause();
    // this.audioEl.srcObject
    //   .getTracks()
    //   .forEach((track) => (track.enabled = playing));
  }

  //  20220206 测试即使通过交互触发，ios safari 仍然不支持音频
  async addAudioTrack() {
    try {
      this.localStream = await window.navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: false,
        })
        .catch((e) => {
          console.error(e);
          throw e;
        });
      this.localStream.getTracks().forEach((track) => {
        track.enabled = this.micphoneEanbled;
        this.rc.addTrack(track);
      });
    } catch (error) {
      console.error(error);
      message.error("开启语音失败 " + error.message);
    }
  }

  async changeMicrophone() {
    this.micphoneEanbled = !this.micphoneEanbled;
    this.localStream &&
      this.localStream
        .getTracks()
        .forEach((track) => (track.enabled = this.micphoneEanbled));
  }

  close() {
    this.socket.removeEventListener("message", this.onSocketMessage);
    this.localStream &&
      this.localStream.getTracks().forEach((track) => track.stop());
    this.rc?.close?.();
    this.rc = undefined;
    this.audioEl.srcObject = null;
    if (this.video) {
      this.video.srcObject = null;
    }
    this.socketSend({ type: "close" });
    this.onClose();
  }
}

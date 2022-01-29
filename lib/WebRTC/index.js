const {
  RTCPeerConnection,
  RTCIceCandidate,
  MediaStream,
  nonstandard: { RTCAudioSink },
} = require("wrtc");
const RTCAudioSource = require("./RTCAudioSource");
const audioPlayer = require("../audioPlayer");

module.exports = class WebRTC {
  constructor({
    socket,
    sendCandidate,
    onOffer,
    onClose,
    onWarnning,
    onError,
    onSuccess,
    rtcDataChannelList,
    onDataChannelOpen,
    onDataChannelClose,
  }) {
    this.socket = socket;
    this.onClose = onClose;
    this.onWarnning = onWarnning;
    this.onDataChannelOpen = onDataChannelOpen;
    this.onDataChannelClose = onDataChannelClose;
    console.log("ws 连接");

    // # 1 创建服务器端 rc
    console.log("Webrtc start!");
    const rc = (this.rc = new RTCPeerConnection({
      // sdpSemantics: "unified-plan",
      iceServers: [
        {
          urls: "stun:gz.esonwong.com:34578",
          username: "networkrc",
          credential: "networkrc",
        },
        // {
        //   urls: "stun:gz.esonwong.com:3478",
        //   username: "eson",
        //   credential: "networkrc",
        // },
        { urls: ["stun:turn2.l.google.com"] },
        {
          urls: "stun:stun.miwifi.com",
        },
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    }));

    rtcDataChannelList.forEach(({ label, onMessage }) => {
      console.log(`WebRTC Create Data Channel: ${label}`);
      this.createChannel({ label, onMessage });
    });

    this.onAudioData = (data) => {
      if (!this.player || this.player.sampleRate !== data.sampleRate) {
        if (this.player) {
          this.player.end();
          delete this.player;
        }
        this.player = audioPlayer.createStreamPlayer({
          label: "WebRTC Audio player",
          ...data,
        });
        this.player.sampleRate = data.sampleRate;
      }
      this.player.write(Buffer.from(data.samples.buffer, data));
    };

    // # 2 添加媒体
    const mediaStream = new MediaStream();
    this.mediaStream = mediaStream;
    this.rtcAudioSource = new RTCAudioSource();
    const audioTrack = this.rtcAudioSource.createTrack();
    mediaStream.addTrack(audioTrack);
    rc.addTrack(audioTrack, mediaStream);

    rc.ontrack = rc.ontrack = (e) => {
      this.receiveAudioTrack = e.track;
      this.openAudioPlayer();
    };

    rc.addEventListener("icecandidate", ({ candidate }) => {
      if (!candidate) return;
      sendCandidate(candidate);
    });

    rc.addEventListener("iceconnectionstatechange", (e) => {
      // console.log("iceConnectionState", e);
      if (rc.iceConnectionState == "failed") {
        // this.close();
        onError && onError(new Error(" WebRTC 连接失败！"));
        this.close();
      }
    });

    rc.addEventListener("connectionstatechange", () => {
      console.log("WebRTC Connection state change:", rc.connectionState);
      switch (rc.connectionState) {
        case "connected":
          if (!this.connected) {
            this.connected = true;
            onSuccess();
            this.rtcAudioSource.start();
          }
          break;
        case "disconnected":
          this.connected = false;
          break;
        case "failed":
          // One or more transports has terminated unexpectedly or in an error
          this.connected = false;
          break;
        case "closed":
          // The connection has been closed
          this.connected = false;
          this.close();
          break;
      }
    });

    (async () => {
      // # 3 服务器 设置服务器本地 description
      const offer = await rc.createOffer({
        offerToReceiveAudio: true,
      });
      await rc.setLocalDescription(offer);
      onOffer(offer);
    })();
  }

  addCandidate(candidate) {
    if (!candidate) return;
    console.log("remote candidate", candidate.candidate);
    this.rc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  onAnswer(description) {
    // # 8 服务器 设置远程 description
    this.rc.setRemoteDescription(description);
  }

  openAudioPlayer() {
    if (!this.receiveAudioTrack) return;
    if (!this.audioSink) {
      const audioSink = new RTCAudioSink(this.receiveAudioTrack);
      this.audioSink = audioSink;
    }
    this.audioSink.addEventListener("data", this.onAudioData);
  }

  createChannel({ label = "controller", onMessage } = {}) {
    const channel = this.rc.createDataChannel(label);
    channel.addEventListener("open", () => {
      console.log(`Data Channel[${label}] open`);
      this.onDataChannelOpen(channel);
    });

    channel.addEventListener("message", ({ data }) => {
      // console.log("Controller Data Channel", data);
      onMessage && onMessage(data);
    });
    channel.addEventListener("close", () => {
      this.onDataChannelClose(channel);
    });
    return channel;
  }

  closeAudioPlayer() {
    if (this.player) {
      this.player.end();
      delete this.player;
    }
  }

  close() {
    if (!this.rc) return;
    console.log("Webrtc close!");
    this.rtcAudioSource.stop();
    this.audioSink && this.audioSink.stop();
    this.closeAudioPlayer();
    this.rc.close();
    this.rc = undefined;
    this.onClose();
  }
};

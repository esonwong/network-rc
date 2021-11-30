const {
  RTCPeerConnection,
  RTCIceCandidate,
  MediaStream,
  nonstandard: { RTCAudioSink },
} = require("wrtc");
const RTCAudioSource = require("./RTCAudioSource");
// const RTCVideoSource = require("./RTCVideoSource");
const { spawn } = require("child_process");
const audioPlayer = require("../AudioPlayer");

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
    }));

    rtcDataChannelList.forEach(({ label, onMessage }) => {
      console.log("WebRTC Create Data Channel", label);
      this.createChannel({ label, onMessage });
    });

    this.onAudioData = (data) => {
      if (!this.player || this.player.sampleRate !== data.sampleRate) {
        if (this.player) {
          this.player.end();
          delete this.player;
        }
        this.player = audioPlayer.createStreamPlayer(data);
        this.player.sampleRate = data.sampleRate;
      }
      this.player.write(Buffer.from(data.samples.buffer, data));
      // if (!this.playerCommand) return;
      // this.playerCommand.stdin.write(Buffer.from(data.samples.buffer));
    };

    // # 2 添加媒体
    const mediaStream = new MediaStream();
    this.mediaStream = mediaStream;
    // this.rtcVideoSource = new RTCVideoSource();
    this.rtcAudioSource = new RTCAudioSource();
    // const videoTrack = this.rtcVideoSource.createTrack();
    const audioTrack = this.rtcAudioSource.createTrack();
    // mediaStream.addTrack(videoTrack);
    mediaStream.addTrack(audioTrack);
    // rc.addTrack(videoTrack, mediaStream);
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
      console.log("Connection state change", rc.connectionState);
      if (rc.connectionState === "connected") {
        onSuccess();
        this.rtcAudioSource.start();
      }
      if (rc.connectionState === "disconnected") {
        this.close();
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
    console.log("Audio plyaer open");
    if (!this.receiveAudioTrack) return;
    if (!this.audioSink) {
      const audioSink = new RTCAudioSink(this.receiveAudioTrack);
      this.audioSink = audioSink;
    }
    // const playerCommand = spawn("aplay", [
    //   "-c",
    //   1,
    //   "-r",
    //   48000,
    //   "-f",
    //   "S16_LE",
    // ]);
    // this.playerCommand = playerCommand;
    // playerCommand.stdin.on("close", () => {
    //   console.error(`Audio plyaer stdin close.`);
    // });
    // playerCommand.stdin.on("finish", () => {
    //   console.error(`Audio plyaer stdin finish.`);
    // });
    // playerCommand.stdin.on("error", (e) => {
    //   // console.error(`Audio plyaer error`, e);
    //   this.onWarnning &&
    //     this.onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"));
    //   this.audioSink.removeEventListener(this.onAudioData);
    //   this.closeAudioPlayer();
    // });
    // playerCommand.stderr.on("data", (data) => {
    //   console.error(`Audio plyaer stderr: ${data}`);
    //   // onError(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    // });

    // playerCommand.on("exit", (code) => {
    //   console.log(`Audio plyaer exit`);
    //   this.audioSink.removeEventListener(this.onAudioData);
    // });

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
      console.log("Audio plyaer close");
      this.player.end();
      delete this.player;
    }
  }

  close() {
    if (!this.rc) return;
    console.log("Webrtc close!");
    this.rtcAudioSource.stop();
    // this.rtcVideoSource.stop();
    this.audioSink && this.audioSink.stop();
    this.closeAudioPlayer();
    this.rc.close();
    this.rc = undefined;
    this.onClose();
  }
};

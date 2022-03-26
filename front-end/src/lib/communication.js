import WebRTC from "./WebRTC";
import { message } from "antd";
import { EventEmitter } from "events";

let socket,
  webrtc,
  webrtcChannel = {};

class Communication extends EventEmitter {
  constructor(config) {
    super();

    this.config = { webrtcEnabled: true, ...config };
  }

  // 连接
  connect({ host, session }) {
    let pingTime, heartbeatTime;
    socket = new WebSocket(
      `${
        window.location.protocol === "https:" ? "wss://" : "ws://"
      }${host}/control?session=${session.id}`
    );

    socket.binaryType = "arraybuffer";

    socket.addEventListener("open", () => {
      pingTime = setInterval(() => {
        const sendTime = new Date().getTime();
        this.sendData("ping", { sendTime });
      }, 1000);

      heartbeatTime = setInterval(() => {
        this.sendData("heartbeat");
      }, 200);

      if (this.config.webrtcEnabled) {
        this.openWebRTC();
      }
    });

    socket.addEventListener("message", this.messageHandle);

    socket.addEventListener("close", () => {
      clearInterval(pingTime);
      clearInterval(heartbeatTime);

      socket.removeEventListener("message", this.messageHandle);

      setTimeout(() => {
        message.error("断开连接，正在重连！");
        this.connect();
      }, 3000);
    });
  }

  openWebRTC({ micphoneEanbled = true }) {
    webrtc = new WebRTC({
      micphoneEanbled,
      socket,
      onClose() {
        webrtc = undefined;
      },
      onDataChannel: (rtcDataChannel) => {
        const { label } = rtcDataChannel;
        webrtcChannel[label] = rtcDataChannel;

        this.emit("rtc-data-channel", rtcDataChannel);

        if (rtcDataChannel.label === "controller") {
          // this.setState({ locked: false });
          rtcDataChannel.addEventListener("message", ({ data }) =>
            this.messageHandle(data)
          );
        }
      },
      onDataChannelClose: (channel) => {
        this.emit("rtc-data-channel-close", channel);
        if (webrtcChannel[channel.label]) {
          delete webrtcChannel[channel.label];
        }
      },
    });
  }

  sendData(action, payload) {
    if (webrtcChannel?.controller?.readyState === "open") {
      webrtcChannel.controller.send(JSON.stringify({ action, payload }));
    } else {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action, payload }));
      } else {
        console.warn("socket is not open");
      }
    }
  }

  messageHandle(data) {
    if (typeof data === "string") {
      const { action, payload } = JSON.parse(data);
      this.emit(action, payload);
    }
  }

  close() {
    socket?.close();
    socket = undefined;
    webrtc?.close();
    webrtc = undefined;
  }
}

export default new Communication();

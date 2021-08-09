import BroadwayPlayer from "Broadway/Player/Player";
import { EventEmitter } from "events";
import { setTimeout } from "timers";

class Player extends EventEmitter {
  constructor({ useWorker, workerFile, sessionId, url } = {}) {
    super();
    // this.canvas = canvas
    // this.canvastype = canvastype
    this.now = new Date().getTime();
    this.url = url;

    this.AvcPlayer = new BroadwayPlayer({
      useWorker,
      workerFile,
      size: {
        width: 640,
        height: 368,
      },
    });
    this.width = 1280;
    this.height = 1024;
    this.AvcPlayer.onPictureDecoded = (_, w, h) => {
      if (w !== this.width || h !== this.height) {
        this.emit("resized", { width: w, height: h });
        this.width = w;
        this.height = h;
      }
    };

    this.ws = undefined;
    this.pktnum = 0;
    this.framesList = [];
    this.running = false;
    this.shiftFrameTimeout = null;
    this.sessionId = sessionId;

    this._messageHandle = this.messageHandle.bind(this);
  }

  shiftFrame = () => {
    if (!this.running) return;

    if (this.framesList.length > 30) {
      console.log("Dropping frames", this.framesList.length);
      const vI = this.framesList.findIndex((e) => (e[4] & 0x1f) === 7);
      // console.log('Dropping frames', framesList.length, vI)
      if (vI >= 0) {
        this.framesList = this.framesList.slice(vI);
      }
      // framesList = []
    }

    const frame = this.framesList.shift();
    this.emit("frame_shift", this.framesList.length);

    if (frame) this.AvcPlayer.decode(frame);

    requestAnimationFrame(this.shiftFrame);
    // this.shiftFrameTimeout = setTimeout(this.shiftFrame, 1)
  };

  connectWs(payload) {
    const url = this.url;
    // Websocket initialization
    if (this.ws !== undefined) {
      this.ws.close();
      delete this.ws;
    }
    this.ws = new WebSocket(
      `${window.location.protocol === "https:" ? "wss://" : "ws://"}${url}`
    );

    this.ws.binaryType = "arraybuffer";

    this.ws.addEventListener("open", () => {
      console.log("Connected to " + url);
      this.emit("connected", url);
      this.send("get-info", { sessionId: this.sessionId });
      this.send("open-request", { sessionId: this.sessionId, ...payload });
    });

    this.ws.addEventListener("message", (e) => {
      this._messageHandle(e);
    });

    this.framesList = [];

    this.ws.onclose = () => {
      this.emit("disconnected");
      console.log("Player: Websocket Connection closed");
    };

    return this.ws;
  }

  setRTCDataChannel(rtcDataChannel) {
    this.rtcDataChannel = rtcDataChannel;
    rtcDataChannel.addEventListener("message", this._messageHandle);
    this.emit("connected");
    this.ws?.close?.();
    this.send("get-info", { sessionId: this.sessionId });
    if (this.opening) {
      this.send("open-request", { sessionId: this.sessionId, ...this.config });
    }
  }

  removeRTCDataChannel() {
    this.send("close");
    this.rtcDataChannel.removeEventListener("message", this._messageHandle);
  }

  messageHandle(evt) {
    if (typeof evt.data == "string") {
      console.log(`Camera message received`, evt);
      const { action, payload } = JSON.parse(evt.data);
      return this.cmd({ action, payload });
    }

    this.pktnum++;
    const frame = new Uint8Array(evt.data);
    // log("[Pkt " + this.pktnum + " (" + evt.data.byteLength + " bytes)]");
    // this.decode(frame);
    this.framesList.push(frame);
    if (!this.running) {
      this.running = true;
      clearTimeout(this.shiftFrameTimeout);
      this.shiftFrameTimeout = null;
      this.shiftFrameTimeout = setTimeout(this.shiftFrame, 1);
    }
  }

  cmd(cmd) {
    switch (cmd.action) {
      case "initalize": {
        return this.emit("initalized", cmd.payload);
      }
      // case "ready":
      //   break;
      default:
        return this.emit(cmd.action, cmd.payload);
    }
  }

  disconnect() {
    this.close();
  }
  // only send json!
  send(action, payload) {
    if (this.rtcDataChannel?.readyState === "open")
      return this.rtcDataChannel.send(JSON.stringify({ action, payload }));
    else
      return (
        this.ws?.readyState === WebSocket.OPEN &&
        this.ws.send(JSON.stringify({ action, payload }))
      );
  }

  open(payload) {
    this.opening = true;
    this.config = payload;
    if (this.rtcDataChannel?.readyState === "open") {
      this.send("get-info", { sessionId: this.sessionId });
      this.send("open-request", { sessionId: this.sessionId, ...this.config });
    } else {
      this.connectWs(payload);
    }
  }

  close() {
    this.opening = false;
    this.send("close");
    this.ws?.close?.();
    this.AvcPlayer.canvas.remove();
  }
}
export default Player;

// module.exports = WSAvcPlayer
// module.exports.debug = debug

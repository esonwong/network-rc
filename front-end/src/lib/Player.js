import BroadwayPlayer from "Broadway/Player/Player";
import { EventEmitter } from "events";

class Player extends EventEmitter {
  constructor({ useWorker, workerFile } = {}) {
    super();
    // this.canvas = canvas
    // this.canvastype = canvastype
    this.now = new Date().getTime();

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

  connectWs(url) {
    // Websocket initialization
    if (this.ws !== undefined) {
      this.ws.close();
      delete this.ws;
    }
    this.ws = new WebSocket(
      `${window.location.protocol === "https:" ? "wss://" : "ws://"}${url}`
    );
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log("Connected to " + url);
      this.emit("connected", url);
    };

    this.framesList = [];

    this.ws.onmessage = (evt) => {
      this.messageHandle(evt);
    };

    this.ws.onclose = () => {
      this.running = false;
      this.emit("disconnected");
      console.log("Player: Websocket Connection closed");
    };

    return this.ws;
  }

  setRTCDataChannel(rtcDataChannel) {
    rtcDataChannel.addEventListener("message", this._messageHandle);
    this.send("get-info");
    this.ws?.close?.();
    this.rtcDataChannel = rtcDataChannel;
  }

  removeRTCDataChannel() {
    this.rtcDataChannel.removeEventListener("message", this._messageHandle);
  }

  messageHandle(evt) {
    if (typeof evt.data == "string") {
      return this.cmd(JSON.parse(evt.data));
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
    console.log("Incoming request", cmd);
    switch (cmd.action) {
      case "initalize": {
        return this.emit("initalized", cmd.payload);
      }
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

  open(url) {
    if (this.rtcDataChannel) {
      this.emit("connected", url);
    } else {
      this.connectWs(url);
    }
  }

  close() {
    this.AvcPlayer.canvas.remove();
  }
}
export default Player;

// module.exports = WSAvcPlayer
// module.exports.debug = debug

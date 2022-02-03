const spawn = require("child_process").spawn;
const { WebSocketServer } = require("@clusterws/cws");

module.exports = class MicrophoneServer {
  constructor({ server }) {
    const path = `/microphone`;
    logger.info(`Microphone websocker server starting`, path);
    const wss = new WebSocketServer(
      {
        noServer: true,
        path,
      },
      () => {
        logger.info(`Microphone websocker server started`, path);
      }
    );

    server.on("upgrade", (request, socket, head) => {
      if (request.url === path)
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
    });

    this.wss = wss;

    wss.on("connection", (socket) => {
      logger.info(`客户端已连接  Microphone Websocket Server`);
      socket.on("close", () => {
        if (wss.clients.length === 0) {
          this.close();
        }
      });

      this.open();
    });

    wss.on("error", (err) => {
      logger.error(err);
    });
  }

  async open() {
    logger.info(`Microphone start`);
    if (this.streamer) {
      logger.info(`Microphone ffmpeg streamer already open`);
      this.close();
    }
    this.streamer = ffmpeg();
    this.streamer.stdout.on("data", (data) => {
      this.broadcastStream(data);
    });
  }

  close() {
    if (this.streamer) {
      logger.info(`Microphone ffmpeg streamer killing`);
      this.streamer.kill("SIGHUP");
      this.streamer = undefined;
    }
  }

  sendBinary(socket, frame) {
    if (socket.buzy) return;
    socket.buzy = true;
    socket.buzy = false;

    socket.send(frame, { binary: true }, function ack() {
      socket.buzy = false;
    });
  }

  broadcast(action, payload) {
    this.wss.clients.forEach((socket) =>
      socket.send(JSON.stringify({ action, payload }))
    );
  }

  broadcastStream(data) {
    this.wss.clients.forEach((socket) => {
      this.sendBinary(socket, data);
    });
  }
};

const ffmpeg = function () {
  const streamer = spawn("ffmpeg", [
    "-f",
    "alsa",
    "-ar",
    16000,
    "-ac",
    1,
    "-i",
    "default",
    "-c:a",
    // "libopus",
    // "-f",
    // "webm",
    "mp3",
    "-f",
    "mp3",
    "-",
  ]);

  streamer.on("close", () => {
    logger.info(" Microphone ffmpeg close");
  });

  streamer.stderr.on("data", (data) => {
    // logger.info("Microphone ffmpeg stderr", data.toString());
  });

  return streamer;
};

const spawn = require("child_process").spawn;
const Splitter = require("stream-split");
const NALseparator = Buffer.from([0, 0, 0, 1]);
const { WebSocketServer } = require("@clusterws/cws");

exports.NALseparator = NALseparator;


module.exports = class Camera {
  constructor({ server, cameraIndex = 0 }) {
    this.options = { cameraIndex };
    const path = `/video${cameraIndex}`;
    this.clients = new Set();
    console.log(`Camera ${cameraIndex} websocker server starting`, path);
    const wss = new WebSocketServer({
      noServer: true,
      path
    }, () => {
      console.log(`Camera ${cameraIndex} websocker server started`, path);
    });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === path)
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
    });

    this.wss = wss;

    wss.on("connection", (socket) => {
      console.log(`客户端已连接 Camera ${cameraIndex}`);
      socket.send(JSON.stringify({ action: "ok" }));

      socket.on("message", (m) => {
        const { action, payload } = JSON.parse(m);
        switch (action) {
          case "resize":
            this.open(payload);
            break;
          default:
        }
      });

      socket.on("close", () => {
        if (wss.clients.length === 0) {
          this.close();
        }
      })

      this.open();

    });

    wss.on("error", err => {
      console.error(err);
    })
  }

  async open({ width = 400, height = 300 } = {}) {
    if (width > 640) {
      width = 640;
      height = 480;
    }
    this.size = { width, height };
    const { cameraIndex } = this.options;
    console.log(`Camera ${cameraIndex} start, ${width}x${height}`);
    if (this.streamer) {
      console.log(`Camera ${cameraIndex} ffmpeg streamer already open`)
      this.close();
    }
    this.start();
    this.streamer = ffmpeg({ width, height }, cameraIndex);
    const readStream = this.streamer.stdout.pipe(new Splitter(NALseparator));
    readStream.on("data", (frame) => {
      this.broadcastStream(Buffer.concat([NALseparator, frame]));
    });
    readStream.on("end", () => {
      this.end();
    });
  }

  start() {
    const { width, height } = this.size;
    this.broadcast("initalize", { width, height });
    this.broadcast("stream_active", true);
  }

  end() {
    this.broadcast("stream_active", false);
  }

  close() {
    if (this.streamer) {
      const { cameraIndex } = this.options;
      console.log(`Camera ${cameraIndex} ffmpeg streamer killing`);
      this.streamer.kill("SIGHUP")
      this.streamer = undefined;
    }
  }

  sendBinary(socket, frame) {
    if (socket.buzy) return;
    socket.buzy = true;
    socket.buzy = false;

    socket.send(
      frame,
      { binary: true },
      function ack() {
        socket.buzy = false;
      }
    );
  }

  broadcast(action, payload) {
    this.wss.clients.forEach(
      (socket) => socket.send(JSON.stringify({ action, payload }))
    );
  };

  broadcastStream(data) {
    this.wss.clients.forEach((socket) => {
      this.sendBinary(socket, data);
    });
  };


}

const ffmpeg = function ({ width, height }, index = 0) {
  const fps = 30;
  const streamer = spawn("ffmpeg", [
    // "-f",
    // "alsa",
    // "-ar",
    // 8000,
    // "-ac",
    // 1,
    // "-i",
    // "plughw:1,0",
    "-f",
    "video4linux2",
    "-s",
    `${width}x${height}`,
    "-r",
    fps,
    "-i",
    `/dev/video${index}`,
    "-c:v",
    "h264_omx",
    "-b:v",
    "1000k",
    "-profile:v",
    "baseline",
    "-f",
    "rawvideo",
    "-"
  ]);


  // streamer.on("close", () => {
  //   console.log("Streamer ffmpeg streamer close");
  // });

  streamer.stderr.on("data", data => {
    // console.log("Streame ffmpeg stderr", data.toString());
  })

  return streamer

};
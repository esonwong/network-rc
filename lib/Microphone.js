const spawn = require("child_process").spawn;
const Splitter = require("stream-split");
const NALseparator = Buffer.from([0, 0, 0, 1]);
const { WebSocketServer } = require("@clusterws/cws");

module.exports = class Microphone {
  constructor({ server }) {
    const path = `/audio`;
    console.log(`Microphone websocker server starting`, path);
    const wss = new WebSocketServer({
      noServer: true,
      path
    }, () => {
      console.log(`Microphone websocker server started`, path);
    });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === path)
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
    });

    this.wss = wss;

    wss.on("connection", (socket) => {
      console.log(`客户端已连接  Microphone`);
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

  async open() {
    console.log(`Microphone start`);
    if (this.streamer) {
      console.log(`Microphone ffmpeg streamer already open`)
      this.close();
    }
    this.streamer = ffmpeg();
    this.streamer.stdout.on("data", (data) => {
      this.broadcastStream(data);
    });
    // const readStream = this.streamer.stdout.pipe(new Splitter(NALseparator));
    // readStream.on("data", (frame) => {
    //   this.broadcastStream(Buffer.concat([NALseparator, frame]));
    // });
    // readStream.on("end", () => {
    // });
  }

  close() {
    if (this.streamer) {
      console.log(`Microphone ffmpeg streamer killing`);
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

const ffmpeg = function () {
  const streamer = spawn("ffmpeg", [
    "-f",
    "alsa",
    "-ar",
    16000,
    "-ac",
    1,
    "-i",
    "plughw:1,0",
    "-c:a",
    "mp3",
    "-f",
    "mp3",
    "-"
  ]);


  streamer.on("close", () => {
    console.log(" Microphone ffmpeg close");
  });

  streamer.stderr.on("data", data => {
    console.log("Microphone ffmpeg stderr", data.toString());
  })

  return streamer

};
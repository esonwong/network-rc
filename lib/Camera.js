const spawn = require("child_process").spawn;
const Splitter = require("stream-split");
const NALseparator = Buffer.from([0, 0, 0, 1]);
const { WebSocketServer } = require("@clusterws/cws");
const status = require('./status')
const { asyncCommand } = require('./unit')

exports.NALseparator = NALseparator;


module.exports = class Camera {
  constructor(options) {
    this.options = options
    const { cameraIndex, cardType, name, size, server } = options;
    this.cameraName = `${name}(${cardType})`
    this.maxSizeWidth = size.width > status.cameraMaxWidth ? status.cameraMaxWidth : size.width
    const path = `/video${cameraIndex}`;
    this.clients = new Set();
    console.log(`Camera ${this.cameraName} websocker server starting`, path);
    const wss = new WebSocketServer({
      noServer: true,
      path
    }, () => {
      console.log(`Camera ${this.cameraName} websocker server started`, path);
    });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === path)
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
    });

    this.wss = wss;

    wss.on("connection", (socket) => {
      console.log(`客户端已连接 Camera ${this.cameraName}`);
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

      this.open(size);

    });

    wss.on("error", err => {
      console.error(err);
    })
  }

  async open({ width = 400, height = 300 }) {
    width = Math.floor(width)
    height = Math.floor(height)
    if (width > this.maxSizeWidth) {
      width = this.maxSizeWidth;
      height = this.maxSizeWidth / this.options.size.width * this.options.size.height;
    }
    if (this.currentSize && (this.currentSize.width === width)) return;
    console.log(`Camera ${this.cameraName} 开启, 分辨率:${width}x${height}`);
    if (this.streamer) {
      console.log(`Camera ${this.cameraName} ffmpeg streamer already open`)
      this.close();
    }

    this.currentSize = { width, height }

    this.broadcast("initalize", { size: { width, height }, cameraName: this.cameraName });
    this.broadcast("stream_active", true);

    this.streamer = ffmpeg({ width, height }, this.options.devPath);
    const readStream = this.streamer.stdout.pipe(new Splitter(NALseparator));
    readStream.on("data", (frame) => {
      this.broadcastStream(Buffer.concat([NALseparator, frame]));
    });
    readStream.on("end", () => {
      this.broadcast("stream_active", false);
    });
  }

  close() {
    if (this.streamer) {
      console.log(`Camera ${this.cameraName} ffmpeg streamer killing`);
      this.streamer.kill("SIGHUP")
      this.streamer = undefined;
      this.currentSize = undefined
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

module.exports.getCameraList = async function () {
  try {
    const devList = []
    return new Promise((resolve) => {
      const v4l = spawn('v4l2-ctl', ['--list-devices'])
      v4l.stdout.on('data', data => {
        data.toString().split('\n').forEach(line => {
          if (/\/dev\/video[0-9]$/.test(line)) {
            devList.push({ dev: line.trim() })
          }
        })
      })
      v4l.on('exit', async () => {
        for (let index = 0; index < devList.length; index++) {
          const item = devList[index];
          let outText = await asyncCommand(`v4l2-ctl --device=${item.dev} --all`)
          const name = /Driver name\s*\:\s*([^.]+)$/msig.exec(outText)[1]
          const cardType = /Card type\s*\:\s*([^.]+)/msig.exec(outText)[1]
          outText = await asyncCommand(`v4l2-ctl --device=${item.dev} --list-formats-ext`)
          const sizeR = /(\d+x\d+)/g
          let size
          let match
          while ((match = sizeR.exec(outText)) !== null) {
            let [width, height] = match[0].split('x')
            width = width - 0
            height = height - 0
            if (size) {
              if (size.width < width) {
                size = { width, height }
              }
            } else {
              size = { width, height }
            }
          }
          item.name = name
          item.cardType = cardType
          item.size = size
        }


        console.log('摄像头列表:')
        devList.forEach(({ name, cardType, dev, size }) => {
          console.log(`  ${name}(${cardType}): ${size.width}x${size.height}`)
        })
        resolve(devList);
      })
    })
  } catch (e) {
    console.error(e)
  }
}

const ffmpeg = function ({ width, height }, input) {
  const fps = 30;
  const streamer = spawn("ffmpeg", [
    "-f",
    "video4linux2",
    "-s",
    `${width}x${height}`,
    "-r",
    fps,
    "-i",
    input,
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



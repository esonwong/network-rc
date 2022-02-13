const spawn = require("child_process").spawn;
const Splitter = require("stream-split");
const NALseparator = Buffer.from([0, 0, 0, 1]);
const { WebSocketServer } = require("@clusterws/cws");
const status = require("./status");
const { asyncCommand } = require("./unit");
const sessionManager = require("./session");

exports.NALseparator = NALseparator;

module.exports = class Camera {
  constructor(options) {
    this.options = options;
    const { cameraIndex, cardType, name, deviceSize, server, devPath, label } =
      options;

    this.rtcDataChannel = [];

    getCameraFormats(devPath).then((v) => {
      this.formatList = v.filter(({ format }) =>
        ["yuyv422", "mjpeg", "h264", "grey"].includes(format)
      );
      logger.info(`${label} 格式列表`, this.formatList);
    });

    if (deviceSize.width - 0 > 640) {
      deviceSize.height = ((deviceSize.height - 0) / deviceSize.width) * 640;
      deviceSize.width = 640;
    }

    this.label = label;
    this.maxSizeWidth =
      deviceSize.width > status.config.cameraMaxWidth
        ? status.config.cameraMaxWidth
        : deviceSize.width;
    const path = `/video${cameraIndex}`;
    logger.info(`Camera ${this.label} websocker server starting`, path);
    const wss = (this.wss = new WebSocketServer(
      {
        noServer: true,
        path,
      },
      () => {
        logger.info(`Camera ${this.label} websocker server started`, path);
      }
    ));

    server.on("upgrade", (request, socket, head) => {
      // todo 权限
      if (request.url === path)
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
    });

    wss.on("connection", async (socket) => {
      logger.info(`客户端已连接 Camera ${this.label}`);

      socket.on("message", (data) => {
        this.messageHandle(data, "ws", socket);
      });

      socket.on("close", () => {
        this.onClose();
      });
      socket.send(JSON.stringify({ acrion: "ready" }));
    });

    wss.on("error", (err) => {
      logger.error(err);
    });
  }

  async open({ width = 400, inputFormatIndex, fps }) {
    logger.info("inputFormatIndex:" + inputFormatIndex);
    logger.info("fps:" + fps);
    logger.info("width:" + width);
    const { deviceSize, devPath } = this.options;
    width = Math.floor(width);
    if (width > this.maxSizeWidth) {
      width = this.maxSizeWidth;
    }

    let height = (width / deviceSize.width) * deviceSize.height;

    /** 编码器要求分辨率为 x 的倍数 */
    const x = 32;
    width = Math.ceil(width / x) * x;
    height = Math.ceil(height / x) * x;

    if (this.streamer) {
      logger.info(`Camera ${this.label} ffmpeg streamer already open`);
      this.close();
    }

    logger.info(`Camera ${this.label} , 输出分辨率:${width}x${height}`);

    this.currentSize = { width, height };

    this.broadcast("open", { inputFormatIndex, fps });
    status.saveConfig({ [devPath]: { inputFormatIndex, fps } });
    this.broadcast("initalize", {
      size: { width, height },
      cameraName: this.label,
    });
    this.broadcast("stream_active", true);

    this.streamer = ffmpeg(
      { width, height },
      this.options.devPath,
      this.formatList[inputFormatIndex],
      fps
    );
    const readStream = this.streamer.stdout.pipe(new Splitter(NALseparator));
    readStream.on("data", (frame) => {
      this.broadcastStream(Buffer.concat([NALseparator, frame]));
    });
    readStream.on("end", () => {
      this.broadcast("stream_active", false);
    });
  }

  messageHandle(data, type, transport) {
    const { action, payload } = JSON.parse(data);
    const config = status.config[this.options.devPath] || {};
    logger.info(
      `Camera Server ${this.label} 收到 ${type} 的 message:${JSON.stringify(
        payload
      )}`
    );
    switch (action) {
      case "open-request":
        if (!transport.user) return;
        let {
          size,
          inputFormatIndex,
          fps = 30,
        } = {
          ...config,
          ...payload,
        };
        if (inputFormatIndex === undefined) {
          const index = this.formatList.findIndex(
            ({ format }) => format === "mjpeg"
          );
          inputFormatIndex = index < 0 ? 0 : index;
        }
        transport.cameraEnabled = true;
        this.open({ width: size && size.width, inputFormatIndex, fps });

        break;
      case "get-info":
        const user = sessionManager.list.find(
          (i) => i.id === payload.sessionId
        );
        transport.user = user;
        if (!transport.user) return;
        transport.send(
          JSON.stringify({
            action: "info",
            payload: {
              size: this.options.deviceSize,
              cameraName: this.label,
              formatList: this.formatList || [],
              ...config,
            },
          })
        );
      case "close":
        transport.cameraEnabled = false;
        this.onClose();
      default:
    }
  }

  onClose() {
    logger.info(`Camera Server ${this.label} onClose`);
    const rtcCount = this.rtcDataChannel.reduce(
      (p, { cameraEnabled }) => p + (cameraEnabled ? 1 : 0),
      0
    );
    const wsClientCount = this.wss.clients.length;
    logger.info(
      `Camera Server wsClientCount ${wsClientCount}, rtcCount: ${rtcCount}`
    );
    if (rtcCount + wsClientCount === 0) {
      this.close();
    }
  }

  close() {
    if (this.streamer) {
      logger.info(`Camera Server ${this.label}: ffmpeg streamer killing`);
      this.streamer.kill();
      this.streamer = undefined;
      this.currentSize = undefined;
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
    logger.info(
      `Camera ${
        this.label
      } broadcase action:${action}, payload:${JSON.stringify(payload)}`
    );
    this.wss.clients.forEach((socket) =>
      socket.send(JSON.stringify({ action, payload }))
    );
    this.rtcDataChannel.forEach((channel) => {
      if (channel.user && channel.readyState === "open")
        channel.send(JSON.stringify({ action, payload }));
    });
  }

  broadcastStream(data) {
    this.wss.clients.forEach((socket) => {
      socket.cameraEnabled && this.sendBinary(socket, data);
    });
    this.rtcDataChannel.forEach((channel) => {
      if (
        channel.user &&
        channel.cameraEnabled &&
        channel.readyState === "open"
      )
        channel.send(data);
    });
  }

  pushRTCDataChannel(channel) {
    logger.info(`Camera Server ${channel.label} 切换到 Webrtc Data Channel`);
    this.rtcDataChannel.push(channel);
    channel.addEventListener("message", ({ data }) => {
      this.messageHandle(data, "rtc", channel);
    });
    channel.send(JSON.stringify({ acrion: "ready" }));
  }
  removeRTCDataChannel(channel) {
    logger.info(`Camera Server ${channel.label} 切换到 Websocket`);
    this.rtcDataChannel.filter((i) => i !== channel);
  }
};

module.exports.getCameraList = async function () {
  try {
    const devList = [];
    return new Promise((resolve) => {
      const v4l = spawn("v4l2-ctl", ["--list-devices"]);
      v4l.stdout.on("data", (data) => {
        data
          .toString()
          .split("\n")
          .forEach((line) => {
            if (/\/dev\/video[0-9]$/.test(line)) {
              devList.push({ dev: line.trim() });
            }
          });
      });
      v4l.on("exit", async () => {
        for (let index = 0; index < devList.length; index++) {
          const item = devList[index];
          let outText = await asyncCommand(
            `v4l2-ctl --device=${item.dev} --all`
          );
          const name = /Driver name\s*\:\s*(.+)/i.exec(outText)[1];
          const cardType = /Card type\s*\:\s*(.+)/i.exec(outText)[1];
          outText = await asyncCommand(
            `v4l2-ctl --device=${item.dev} --list-formats-ext`
          );
          const sizeR = /(\d+x\d+)/g;
          let size;
          let match;
          while ((match = sizeR.exec(outText)) !== null) {
            let [width, height] = match[0].split("x");
            width = width - 0;
            height = height - 0;
            if (size) {
              if (size.width < width) {
                size = { width, height };
              }
            } else {
              size = { width, height };
            }
          }
          item.name = name;
          item.cardType = cardType;
          item.size = size;
          item.label = `${name}(${cardType})`;
        }

        devList.forEach(({ label, cardType, dev, size }) => {
          if (size) {
            logger.info(
              `  ${label} \n 最大分辨率: ${size.width}x${size.height}`
            );
          } else {
            logger.info(`  ${label}  \n 无法获取分辨率，已过滤`);
          }
        });
        resolve(devList.filter((i) => i.size));
      });
    });
  } catch (e) {
    logger.error(e);
  }
};

const getCameraFormats = async function (devPath) {
  const result = await asyncCommand(
    `ffmpeg -f v4l2 -list_formats all -i ${devPath}`,
    "stderr"
  );
  const regexp =
    /\[video4linux2,v4l2 \@ ([\s\S]+?)\] ([\S]+) *?\:\s*([\S]+) \: +[\s\S]+?: ([\s\S]+?)\n/g;
  const list = [];
  while ((match = regexp.exec(result)) != null) {
    const [string, id, compressed, format, size = ""] = match;
    (size.match(/\d+x\d+/g) || ["640x480"]).forEach((size) => {
      list.push({ id, format, size });
    });
  }
  return list;
};

const ffmpeg = function (outSize, input, inputformat, fps = 30) {
  logger.info(`${input} input format`, inputformat);
  logger.info(`${input} input fps`, fps);
  const streamer = spawn("ffmpeg", [
    "-f",
    "video4linux2",
    "-input_format",
    inputformat.format,
    "-s",
    inputformat.size,
    "-r",
    fps,
    "-i",
    input,
    "-c:v",
    "h264_omx",
    // "h264_v4l2m2m",
    "-b:v",
    "1000k",
    // "-preset",
    "-profile:v",
    // "0",
    "baseline",
    "-f",
    "rawvideo",
    "-s",
    `${outSize.width}x${outSize.height}`,
    "-r",
    fps,
    "-",
  ]);

  streamer.on("close", (e) => {
    logger.info("Streamer ffmpeg streamer close", e);
  });

  streamer.stderr.on("data", (data) => {
    // logger.info(`Streame ffmpeg stderr ${input}`, data.toString());
  });

  streamer.stdout.on("data", (data) => {
    // logger.info(`Streame ffmpeg stdout ${input}`, data.toString());
  });

  return streamer;
};

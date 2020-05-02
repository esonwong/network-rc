const spawn = require("child_process").spawn;
const net = require('net');

const cameraModes = {
  default: {
    fps: 30,
    exposure: "auto",
    width: 400,
    height: 300,
  },
  "480p-15fps": {
    fps: 30,
    exposure: "auto",
    width: 640,
    height: 480,
  },
  "600p": {
    fps: 30,
    exposure: "auto",
    width: 800,
    height: 600,
  },
  "1080p": {
    fps: 30,
    exposure: "auto",
    width: 1440,
    height: 1080,
  },
};

exports.cameraModes = cameraModes;
exports.raspivid = function (cameraMode) {


  const streamer = spawn("raspivid", [
    "-t",
    "0",
    "-o",
    "-",
    "-w",
    cameraModes[cameraMode].width,
    "-h",
    cameraModes[cameraMode].height,
    "-fps",
    cameraModes[cameraMode].fps,
    "-pf",
    "baseline",
    "-ex",
    cameraModes[cameraMode].exposure,
  ]);

  streamer.on("close", () => {
    console.log("stream close");
  });


  return streamer;
};

exports.ffmpeg = function (cameraMode, cb) {
  const width = 400, height = 300;
  cb({ width, height });
  spawn("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "panic",
    "-f",
    "alsa",
    "-ar",
    8000,
    "-ac",
    1,
    "-i",
    "",
    "-f",
    "video4linux2",
    "-s",
    `${width}x${height}`,
    "-r",
    15,
    "-i",
    "/dev/video0",
    "-c:v",
    "h264_omx",
    "-profile:v",
    "baseline",
    "-f",
    "rawvideo",
    "tcp://0.0.0.0:8097"
  ]);
  return new Promise(resolve => {
    const tcpServer = net.createServer((socket) => {
      console.log("tcp 流启动");
      socket.on('error', e => {
        console.log('video downstream error:', e)
      }); 
      socket.on('connect', e => {
        console.log('video downstream connect:', e)
      });
      resolve(socket)
    })

    console.log("tcp 监听");
    tcpServer.listen(8097, '0.0.0.0')
  })
};

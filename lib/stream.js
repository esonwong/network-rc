const spawn = require("child_process").spawn;
const Splitter = require("stream-split");
const NALseparator = Buffer.from([0, 0, 0, 1]);

exports.NALseparator = NALseparator;

const cameraModes = {
  default: {
    fps: 30,
    exposure: "auto",
    width: 640,
    height: 480,
  },
  "300p-15fps": {
    fps: 30,
    exposure: "auto",
    width: 400,
    height: 300,
  },
  "300p-15fps-night": {
    fps: 30,
    exposure: "night",
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

// exports.raspivid = function (cameraMode) {
//   const streamer = spawn("raspivid", [
//     "-t",
//     "0",
//     "-o",
//     "-",
//     "-w",
//     cameraModes[cameraMode].width,
//     "-h",
//     cameraModes[cameraMode].height,
//     "-fps",
//     cameraModes[cameraMode].fps,
//     "-pf",
//     "baseline",
//     "-ex",
//     cameraModes[cameraMode].exposure,
//   ]);

//   streamer.on("close", () => {
//     logger.info("stream close");
//   });

//   return streamer;
// };

const ffmpeg = function (cameraMode) {
  const { width, height, fps } = cameraModes[cameraMode];
  const streamer = spawn("ffmpeg", [
    "-f",
    "alsa",
    "-ar",
    16000,
    "-ac",
    1,
    "-i",
    "plughw:1,0",
    "-f",
    "video4linux2",
    "-s",
    `${width}x${height}`,
    "-r",
    fps,
    "-probesize",
    200000,
    "-i",
    "/dev/video0",
    "-tune",
    "zerolatency",
    "-c:v",
    "h264_omx",
    "-b:v",
    "1000k",
    "-profile:v",
    "baseline",
    // "-preset", "ultrafast",
    "-g",
    2,
    "-movflags",
    "+frag_keyframe+empty_moov+default_base_moof",
    "-c:a",
    "aac",
    "-f",
    "mp4",
    "-",
  ]);
  streamer.on("close", () => {
    logger.info("Streamer ffmpeg streamer close");
  });

  streamer.stderr.on("data", (data) => {
    logger.info("Streamer ffmpeg stderr", data.toString());
  });

  return streamer;
};

let streamer;
exports.startMediaStream = async function (
  cameraMode,
  { onStart, onEnd, onData }
) {
  logger.info("Start edia stream");
  if (streamer) {
    logger.info("Streamer ffmpeg streamer already open");
    stopMediaStream();
  }
  onStart();
  streamer = ffmpeg(cameraMode);
  let oldBuf = Buffer.from([]);
  streamer.stdout.on("data", (buffer) => {
    // if (buffer[4] == 'm' && buffer[5] == 'o' && buffer[6] == 'o' && buffer[7] == 'f') {
    //   onData(oldBuf);
    //   oldBuf = buffer;
    // } else {
    //   oldbuf = Buffer.concat([oldBuf, buffer]);  // append data to the old buffer
    // }
    onData(buffer);
  });
  // const readStream = streamer.stdout.pipe(new Splitter(NALseparator));
  // readStream.on("data", (frame) => {
  //   onData(frame);
  // });
  readStream.on("end", () => {
    onEnd();
  });
};

const stopMediaStream = function () {
  if (streamer) {
    logger.info("Streamer ffmpeg streamer kill");
    streamer.kill("SIGHUP");
    streamer = undefined;
  }
};
exports.stopMediaStream = stopMediaStream;

// exports._ffmpeg = function (cameraMode, cb) {
//   const width = 400, height = 300;
//   cb({ width, height });
//   spawn("ffmpeg", [
//     "-hide_banner",
//     "-loglevel",
//     "panic",
//     "-f",
//     "alsa",
//     "-ar",
//     8000,
//     "-ac",
//     1,
//     "-i",
//     "",
//     "-f",
//     "video4linux2",
//     "-s",
//     `${width}x${height}`,
//     "-r",
//     15,
//     "-i",
//     "/dev/video0",
//     "-c:v",
//     "h264_omx",
//     "-profile:v",
//     "baseline",
//     "-f",
//     "rawvideo",
//     "tcp://0.0.0.0:8097"
//   ]);
//   return new Promise(resolve => {
//     const tcpServer = net.createServer((socket) => {
//       logger.info("tcp 流启动");
//       socket.on('error', e => {
//         logger.info('video downstream error:', e)
//       });
//       socket.on('connect', e => {
//         logger.info('video downstream connect:', e)
//       });
//       resolve(socket)
//     })

//     logger.info("tcp 监听");
//     tcpServer.listen(8097, '0.0.0.0')
//   })
// };

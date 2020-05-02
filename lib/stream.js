exports.raspivid = function (cameraMode) {
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

  return spawn("raspivid", [
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
};

exports.ffmpeg = function (cameraMode) {
  return spawn("ffmpeg", [
    "-f",
    "alsa",
    "-ar",
    8000,
    "-ac",
    1,
    "-i",
    "",
    "-f",
    "video4linux2 -s",
    "400x300",
    "-r",
    15,
    "-i",
    "/dev/video0",
    "-c:v",
    "h264_omx",
    "-profile:v",
    "baseline",
    "-f",
    "mpegts",
    "-",
  ]);
};

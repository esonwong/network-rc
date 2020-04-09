const AvcServer = require("ws-avc-player/lib/server");
const path = require("path");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const { WebSocketServer } = require("@clusterws/cws");
const rpio = require("rpio");

app.use(express.static(path.resolve(__dirname, "./front-end/build")));

rpio.init({
  gpiomem:false
});
rpio.pwmSetClockDivider(512);

const width = 400,
      height = 300,fps=15;

const directionPin = 32,
      speedPin = 33;
function initGPIO(){
  rpio.open(directionPin, rpio.PWM);
  rpio.open(speedPin, rpio.PWM);
  rpio.pwmSetClockDivider(512);
  rpio.pwmSetRange(directionPin, 100);
  rpio.pwmSetRange(speedPin, 100);
  rpio.pwmSetData(speedPin, 60);
  rpio.pwmSetData(directionPin, 60);
}
// direction range 100 data 30 ~ 90
// speed range 100 data 36~60~80

const changeSpeed = function (v) {
  if (v == 0) {
    rpio.pwmSetData(speedPin, 60);
  } else {
    rpio.pwmSetData(speedPin, Math.round(60 + v * 20));
  }
};

const changeDirection = function (v) {
  if (v == 0) {
    rpio.pwmSetData(directionPin, 60);
  } else {
    rpio.pwmSetData(directionPin, Math.round(60 + v * 30));
  }
};

const wss = new WebSocketServer({ server });
const avcServer = new AvcServer(wss, width, height);

avcServer.on("client_connected", () => {
    console.log("client connected");
    initGPIO();
    });

avcServer.client_events.on("open camera", function (v) {
    console.log("open camera", v);
    if (v) {
    streamer || startStreamer();
    } else {
    streamer && streamer.kill("SIGTERM");
    }
    });

avcServer.client_events.on("speed zero rate", (rate) => {
    console.log("speed zero rate", rate);
    });

avcServer.client_events.on("speed rate", (v) => {
    console.log("speed", v);
    changeSpeed(v);
    });

avcServer.client_events.on("direction rate", (v) => {
    console.log("direction", v);
    changeDirection(v);
    });

avcServer.on("client_disconnected", () => {
    console.log("client disconnected");
    changeSpeed(0);
    if (avcServer.clients.size < 1) {
    if (!streamer) {
    return;
    }
    streamer.kill("SIGTERM");
    }
    });

let streamer = null;

const startStreamer = () => {
  console.log("starting streamer");
  //  streamer = spawn("raspivid", [
  //    "-pf",
  //    "baseline",
  //    "-ih",
  //    "-t",
  //    "0",
  //    "-w",
  //    width,
  //    "-h",
  //    height,
  //    "-hf",
  //    "-fps",
  //    "15",
  //    "-g",
  //    "30",
  //    "-o",
  //    "-",
  //  ]);
  streamer = spawn("raspivid", [
      "-t",
      "0",
      "-o",
      "-",
      "-w",
      width,
      "-h",
      height,
      "-fps",
      fps,
      "-pf",
      "baseline"
  ]);
  streamer.on("close", () => {
      streamer = null;
      });

  avcServer.setVideoStream(streamer.stdout);
};

server.listen(8080);

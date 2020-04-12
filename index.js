const AvcServer = require("ws-avc-player/lib/server");
const path = require("path");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const { WebSocketServer } = require("@clusterws/cws");
const pwm = require("rpio-pwm");

app.use(express.static(path.resolve(__dirname, "./front-end/build")));

const width = 400,
  height = 300,
  fps = 15;

const refresh = 500,
  stepTimeUs = refresh / 100,
  pwmCfg = {
    cycle_time_us: refresh, // default 20000us (20ms)
    step_time_us: stepTimeUs, // default 10us
    delay_hw: 0, // 0=PWM, 1=PCM, (default 0)
    invert: 0, // invert high/low (default 0=no invert)
  },
  ch = pwm.create_dma_channel(14, pwmCfg),
  directionPin = ch.create_pwm(12),
  speedPin = ch.create_pwm(13);

function setRound(pin, round) {
  pin.set_width(round, stepTimeUs * round);
}

process.on("exit", function () {
  ch.shutdown();
  console.log("Goodbye!");
});

// direction range 100 data 30 ~ 90
// speed range 100 data 36~60~80

const changeSpeed = function (v) {
  if (v == 0) {
    setRound(speedPin, 60);
  } else {
    setRound(speedPin, Math.round(60 + v * 20));
  }
};

const changeDirection = function (v) {
  if (v == 0) {
    setRound(directionPin, 75);
  } else {
    setRound(directionPin, Math.round(v * 25 + 50));
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
    "baseline",
  ]);
  streamer.on("close", () => {
    streamer = null;
  });

  avcServer.setVideoStream(streamer.stdout);
};

server.listen(8080);

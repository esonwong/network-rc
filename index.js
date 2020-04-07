const AvcServer = require("ws-avc-player/lib/server");
const path = require("path");
const net = require("net");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const { WebSocketServer } = require("@clusterws/cws");

app.use(express.static(path.resolve(__dirname, "./front-end/build")));

const width = 400,
  height = 300;

const wss = new WebSocketServer({ server });
const avcServer = new AvcServer(wss, width, height);

avcServer.on("client_connected", () => {});

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

avcServer.client_events.on("speed rate", (rate) => {
  console.log("speed rate", rate);
});

avcServer.client_events.on("direction rate", (rate) => {
  console.log("direction rate", rate);
});

avcServer.on("client_disconnected", () => {
  console.log("client disconnected");
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
  streamer = spawn("raspivid", [
     "-pf",
     "baseline",
     "-ih",
     "-t",
     "0",
     "-w",
     width,
     "-h",
     height,
     "-hf",
     "-fps",
     "15",
     "-g",
     "30",
     "-o",
     "-",
   ]);
  streamer.on("close", () => {
    streamer = null;
  });

  avcServer.setVideoStream(streamer.stdout);
};

server.listen(8080);

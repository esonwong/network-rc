const AvcServer = require("ws-avc-player/lib/server");
const path = require("path");
const net = require("net");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const { WebSocketServer } = require("@clusterws/cws");

app.use(express.static(path.resolve(__dirname, "./front-end/build")));

const wss = new WebSocketServer({ server });

const useRaspivid = process.argv.includes("raspivid");
const avcServer = new AvcServer(wss, 400, 300);

avcServer.on("client_connected", () => {});

avcServer.client_events.on("open camera", function (v) {
  console.log("open camera", v);
  if (v) {
    streamer || startStreamer();
  } else {
    streamer && streamer.kill("SIGTERM");
  }
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

// RPI example

let streamer = null;
const streamerCommand = useRaspivid
  ? `raspivid -pf baseline -ih -t 0 -w ${width} -h ${height} -hf -fps 15 -g 30 -o -`
  : `ffmpeg -framerate 30 -f avfoundation -i 0  -vcodec libx264 -vprofile baseline -b:v 500k -bufsize 600k -tune zerolatency -pix_fmt yuv420p -r 15 -g 30 -f mp4 -`;
if (useRaspivid) {
} else {
  // create the tcp sever that accepts a h264 stream and broadcasts it back to the clients
  this.tcpServer = net.createServer((socket) => {
    // set video stream
    socket.on("error", (e) => {
      console.log("video downstream error:", e);
    });
    avcServer.setVideoStream(socket);
  });
  this.tcpServer.listen(5000, "0.0.0.0");
}

const startStreamer = () => {
  console.log("starting streamer");
  streamer = spawn(streamerCommand);
  // streamer = spawn("raspivid", [
  //   "-pf",
  //   "baseline",
  //   "-ih",
  //   "-t",
  //   "0",
  //   "-w",
  //   width,
  //   "-h",
  //   height,
  //   "-hf",
  //   "-fps",
  //   "15",
  //   "-g",
  //   "30",
  //   "-o",
  //   "-",
  // ]);
  streamer.on("close", () => {
    streamer = null;
  });

  avcServer.setVideoStream(streamer.stdout);
};

server.listen(8080);

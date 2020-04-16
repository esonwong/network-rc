const path = require("path");
const express = require("express");
const { WebSocketServer } = require("@clusterws/cws");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const package = require("./package.json");
const argv = require("yargs").argv;
const md5 = require("md5");
const Splitter = require("stream-split");

const {
  changeLight,
  changeDirection,
  changeSpeed,
  closeController
} = require("./lib/controller.js");

console.info("版本", package.version);
console.info("参数", argv);

const { password, maxSpeed = 30 } = argv;

app.use(express.static(path.resolve(__dirname, "./front-end/build")));

const cameraModes = {
  default: {
    fps: 15,
    exposure: "auto",
    width: 400,
    height: 300,
  },
  local: {
    fps: 30,
    exposure: "sports",
    width: 800,
    height: 600,
  },
};

const NALseparator = Buffer.from([0, 0, 0, 1]);

let cameraMode = "default";

const wss = new WebSocketServer({ server });
const clients = new Set();
function sendData(action, payload) {
  this.send(JSON.stringify({ action, payload }));
}

function sendBinary(socket,frame) {
  if (socket.buzy) return;
  socket.buzy = true;
  socket.buzy = false;

  socket.send(
    Buffer.concat([NALseparator, frame]),
    { binary: true },
    function ack() {
      socket.buzy = false;
    }
  );
}

const broadcast = (action, payload) => {
  clients.forEach((socket) => socket.sendData(action, payload));
};

const broadcastStream = (data) => {
  clients.forEach((socket) => {
    if (socket.enabledCamera) {
      socket.sendBinary(socket,data);
    }
  });
};

wss.on("connection", function (socket) {
  console.log("客户端连接！");
  console.log("设置密码", password ? "是": "否");
  socket.isLogin = password ? false : true;
  clients.add(socket);
  socket.sendData = sendData;
  socket.sendBinary = sendBinary;
  socket.sendData("init", {
    maxSpeed,
  });
  socket.sendData(
    'initalize',
    {
      width: cameraModes[cameraMode].width,
      height: cameraModes[cameraMode].height,
      stream_active: false 
    },
  );
  socket.sendData('stream_active', false);

  socket.on("close", () => disconnect(socket));

  socket.on("message", (m) => {
    const { action, payload } = JSON.parse(m);

    switch (action) {
      case "login":
        login(socket, payload);
        break;
      case "open camera":
        openCamera(socket, payload);
        break;
      case "open light":
        openLight(socket, payload);
        break;
      case "speed rate":
        speedRate(socket, payload);
        break;
      case "dirction rate":
        directionRate(socket, payload);
        break;
      default:
        console.log("怎么了？");
    }
  });
});

const login = (socket, { uid, token }) => {
  console.log("login", token);
  if (socket.islogin) {
    socket.sendData("login", { status: 1, message: "已登陆！" });
  }
  if (md5(password + "eson") == token) {
    socket.isLogin = true;
    socket.sendData("login", { status: 0, message: "OMG 你登录啦！" });
  }
};

const check = (socket) => {
  if ( socket.isLogin) {
    return true;
  } else {
    console.error("未登录！");
    socket.sendData("error", { status: 1, message: "未登录！" });
    return false;
  }
};

const openCamera = (socket, v) => {
  console.log("open camera", v);
  if (!check(socket)) return;
  if (v.enabled) {
    cameraMode = v.cameraMode;
    socket.enabledCamera = true;
    streamer || startStreamer();
    socket.sendData("stream_active", true);
  } else {
    socket.enabledCamera = false;
    socket.sendData("stream_active", false);
    endStreamer();
  }
};

const speedRate = (socket, v) => {
  console.log("speed", v);
  if (!check(socket)) return;
  changeSpeed(v);
  broadcast("speed", v);
};

const directionRate = (socket, v) => {
  console.log("direction", v);
  if (!check(socket)) return;
  changeDirection(v);
  broadcast("direction", v);
};

const openLight = (socket, enabled) => {
  console.log("open light", enabled);
  if (!check(socket)) return;
  changeLight(enabled);
  broadcast("light enabled", enabled);
};

const disconnect = (socket) => {
  console.log("client disconnected");
  clients.delete(socket);
  if (clients.size < 1) {
    changeSpeed(0);
    changeLight(false);
  }
  endStreamer();
};

// init
changeSpeed(0);
changeLight(false);

process.on("SIGINT", function () {
  closeController();
  changeLight(false);
  console.log("Goodbye!");
  process.exit();
});

let streamer = null;

const startStreamer = () => {
  console.log("starting streamer");
  if (streamer) return;
  streamer = spawn("raspivid", [
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

  streamer.on('close', () => {
    streamer = null
  })


  const readStream =  streamer.stdout.pipe(new Splitter(NALseparator));

  readStream.on("data", (frame) => {
    broadcastStream(frame);
  });
  // broadcast('stream_active', true );
  readStream.on('end', () => broadcast('stream_active', false ))
};

const endStreamer = () => {
  let enabledNum = 0;
  clients.forEach(i => i.enabledCamera && enabledNum++)
  if (enabledNum) return;
  console.log("close streamer");
  streamer && streamer.kill("SIGTERM");
};

server.listen(8080);

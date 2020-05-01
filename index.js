const path = require("path");
const express = require("express");
const { WebSocketServer } = require("@clusterws/cws");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const package = require("./package.json");
const md5 = require("md5");
const Splitter = require("stream-split");
const argv = require("yargs")
  .usage('Usage: $0 [options]')
  .example('$0 -f -o 9088', '开启网络穿透')
  .options({
    's': {
      alias: 'maxSpeed',
      default: 60,
      describe: '最大速度',
      type: 'number'
    },
    'p': {
      alias: 'password',
      describe: '密码',
      type: 'string'
    },
    'f': {
      alias: 'frp',
      describe: '是否开启网络穿透',
      type: 'boolean'
    },
    'o': {
      alias: 'frpPort',
      describe: "frp 远程端口, 用于访问遥控车控制界面, remote_port",
      type: 'number'
    },
    'frpServer': {
      default: "itiwll.synology.me",
      describe: "frp 服务器, server_addr",
      type:"string"
    },
    'frpServerPort': {
      default: 6401,
      describe: "frp 服务器连接端口, server_port",
      type:"number"
    },
    'frpServerToken': {
      default: "9080",
      describe: "frp 服务器认证token, token",
      type:"string"
    }
  })
  .env('NETWORK_RC')
  .help()
  .argv;

console.info("版本", package.version);
console.info("鸣谢：");
console.info("  Eson Wong - 提供免费的 frp 服务器");

const {
  changeLight,
  changeDirection,
  changeSpeed,
  closeController,
} = require("./lib/controller.js");
const { password, maxSpeed, frp, frpPort, frpServer, frpServerPort, frpServerToken } = argv;

if(frp){
  if(!frpPort){
    console.error("启用网络穿透请设置远程端口！ 例如：-f -o 9099");
    process.exit();
  } else {
    process.env.FRP_REMOTE_PORT = frpPort
    process.env.FRP_SERVER = frpServer
    process.env.FRP_SERVER_PORT = frpServerPort
    process.env.FRP_SERVER_TOKEN = frpServerToken
    require("./lib/frp.js")
  }
}

app.use(express.static(path.resolve(__dirname, "./front-end/build")));
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/front-end/build/index.html'));
});

const cameraModes = {
  default: {
    fps: 30,
    exposure: "auto",
    width: 400,
    height: 300,
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
  '600p': {
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

const NALseparator = Buffer.from([0, 0, 0, 1]);

let cameraMode = "default";

const wss = new WebSocketServer({ server });
const clients = new Set();
function sendData(action, payload) {
  this.send(JSON.stringify({ action, payload }));
}

function sendBinary(socket, frame) {
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
  clients.forEach((socket) => socket.isLogin && socket.sendData(action, payload));
};

const broadcastStream = (data) => {
  clients.forEach((socket) => {
    if (socket.isLogin) {
      socket.sendBinary(socket, data);
    }
  });
};

wss.on("connection", function (socket) {
  console.log("客户端连接！");
  console.log("设置密码", password ? "是" : "否");
  socket.isLogin = password ? false : true;
  clients.add(socket);
  socket.sendData = sendData;
  socket.sendBinary = sendBinary;
  socket.sendData("controller init", {
    maxSpeed,
    needPassword: password ? true : false,
  });
  socket.sendData("initalize", {
    width: cameraModes[cameraMode].width,
    height: cameraModes[cameraMode].height,
    stream_active: false,
  });
  socket.sendData("stream_active", false);

  socket.on("close", () => disconnect(socket));

  socket.on("message", (m) => {
    const { action, payload } = JSON.parse(m);

    switch (action) {
      case "ping":
        ping(socket, payload);
        break;
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
      case "direction rate":
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
  } else {
    socket.sendData("error", { status: 1, message: "哎呦喂，密码错了啊！" });
  }
};

const ping = (socket, { sendTime }) => {
  socket.sendData("pong", { sendTime })
}

const check = (socket) => {
  if (socket.isLogin) {
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
    //socket.enabledCamera = true;
    streamer || startStreamer();
    broadcast("stream_active", true);
  } else {
    //socket.enabledCamera = false;
    broadcast("stream_active", false);
    endStreamer();
  }
};

const speedRate = (socket, v) => {
  console.log("speed", v);
  if (!check(socket)) return;
  if(Math.abs(v) *100 > maxSpeed){
    v = v > 0 ? maxSpeed /100 : -maxSpeed /100;
  }
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
    endStreamer();
  }
};

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

  streamer.on("close", () => {
    streamer = null;
  });

  const readStream = streamer.stdout.pipe(new Splitter(NALseparator));

  readStream.on("data", (frame) => {
    broadcastStream(frame);
  });
  // broadcast('stream_active', true );
  readStream.on("end", () => broadcast("stream_active", false));
};

const endStreamer = () => {
  let enabledNum = 0;
  clients.forEach((i) => i.enabledCamera && enabledNum++);
  if (enabledNum) return;
  console.log("close streamer");
  streamer && streamer.kill("SIGTERM");
};

server.listen(8080);

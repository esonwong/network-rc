const path = require("path");
const express = require("express");
const { WebSocketServer } = require("@clusterws/cws");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const package = require("./package.json");
const argv = require('yargs').argv;
const md5 = require("md5");
const { changeLight, changeDirection, changeSpeed } = require("./lib/controller.js")

console.info("版本", package.version);
console.info("参数", argv);

const userList = [];

const { password, maxSpeed=30,  } = argv;

app.use(express.static(path.resolve(__dirname, "./front-end/build")));

const width = 400,
  height = 300,
  cameraModes = {
    default: {
      fps: 15,
      exposure: "auto",
      width: 400,
      height: 300
    },
    local: {
      fps: 30,
      exposure: "sports",
      width: 800,
      height: 600
    }
  };


let cameraMode = "default";


const wss = new WebSocketServer({ server });
const clients = new Set();
function sendData(action,payload) {
  this.send(JSON.stringify({ action, payload })))
}

function sendBinary(binary) {
  if (socket.buzy)
    return
  const socket = this;
  socket.buzy = true
  socket.buzy = false

  socket.send(Buffer.concat([ NALseparator, frame ]), { binary: true }, function ack () {
    socket.buzy = false
  })
}


wss.on("connection", function(socket){
  clients.add(socket);
  socket.sendData = sendData;
  socket.sendBinary = sendBinary;
  socket.on('message', m => {
    const { action, payload } = JSON.parse(m)

    switch(action):
      case "login":
        login(socket, payload);
        break;
      case "open camera":
        openCamera(socket, payload);
      case ""
      default:
  });
}

const login(socket,{ uid, token }){
  console.log("login", token);
  if(socket.islogin) {
    socket.sendData({ status: 1 ,message: '已登陆！'})
  }
  if(md5(password + "eson") == token){
    socket.isLogin = true
    socket.sendData({ status: 0 ,message: '登录成功！'})
  } 
}

const openCamera = (socket, v) => {
  console.log("open camera", v);
  if (v.enabled) {
    cameraMode = v.cameraMode
    streamer || startStreamer();
  } else {
    streamer && streamer.kill("SIGTERM");
  }
}



const speedRate = (socket, v) => {
  console.log("speed", v);
  changeSpeed(v);
});

const directionRate = (socket, v) => {
  console.log("direction", v);
  changeDirection(v);
});

const openLight = (socket, enable) => {
  console.log("open light", enabled);
  changeLight(enabled);
});


const disconnect=> ( socket ) => {
  console.log("client disconnected");
  changeSpeed(0);
  if (clients.size < 1) {
    if (!streamer) {
      return;
    }
    streamer.kill("SIGTERM");
    changeLight(false);
  }
});
})

const avcServer = new AvcServer(wss, width, height);

// init
initSpeedPin();
initDirectionPin();
changeSpeed(0);
changeLight(false);

process.on("SIGINT", function () {
  speedCh.shutdown();
  directionCh.shutdown();
  changeLight(false);
  console.log("Goodbye!");
  process.exit();
});

avcServer.on("client_connected", (socket) => {
  console.log("client connected");
  if(password) {
    socket.emit
  }
  avcServer.broadcast("config",{
    maxSpeed,
    needPassword: password ? true : false
  });
});



let streamer = null;

const startStreamer = () => {
  console.log("starting streamer");
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

  avcServer.setVideoStream(streamer.stdout);
};

server.listen(8080);

const path = require("path");
const express = require("express");
const { WebSocketServer, secureProtocol } = require("@clusterws/cws");
const app = express();
const package = require("./package.json");
const md5 = require("md5");
const { spawn } = require('child_process');
const User = require("./lib/user")
const TTS = require("./lib/tts");
const Camera = require("./lib/Camera");
const Microphone = require("./lib/Microphone");
const { existsSync, readFileSync } = require("fs");
const { sleep } = require("./lib/unit")
const argv = require("yargs")
  .usage("Usage: $0 [options]")
  .example("$0 -f -o 9058", "开启网络穿透")
  .options({
    u: {
      alias: "userList",
      default: false,
      type: "boolean",
      describe: "用户列表",
    },
    s: {
      alias: "maxSpeed",
      default: 100,
      describe: "最大速度",
      type: "number",
    },
    p: {
      alias: "password",
      describe: "密码",
      type: "string",
    },
    f: {
      alias: "frp",
      describe: "是否开启网络穿透",
      type: "boolean",
    },
    t: {
      alias: "tts",
      describe: "是否开启语音播报",
      type: "boolean",
      default: true
    },
    o: {
      alias: "frpPort",
      describe: "frp 远程端口, 用于访问遥控车控制界面, remote_port",
      type: "number",
    },
    frpServer: {
      default: "home.esonwong.com",
      describe: "frp 服务器, server_addr",
      type: "string",
    },
    frpServerPort: {
      default: 9910,
      describe: "frp 服务器连接端口, server_port",
      type: "number",
    },
    frpServerToken: {
      default: "eson's network-rc",
      describe: "frp 服务器认证token, token",
      type: "string",
    },
  })
  .env("NETWORK_RC")
  .help().argv;

console.info("版本", package.version);
console.info("鸣谢：");
console.info(`
- @千 - 在爱发电的支持
- @一生无悔 - 在爱发电的支持
- @摩天 - 在爱发电的支持
- @爱发电用户_t87M - 在爱发电的支持
- @桥段 - 在爱发电的支持
- Eson Wong - 提供免费的 frp 服务
`);

const {
  maxSpeed,
  frp,
  frpPort,
  frpServer,
  frpServerPort,
  frpServerToken,
  userList,
  tts
} = argv;
let { password } = argv;
let currentUser;

process.env.TTS = tts;


const enabledHttps = frp && (frpServer === 'home.esonwong.com')



const {
  changeLight,
  changeDirection,
  changeSpeed,
  closeController,
  changePower,
  changeSteering
} = require("./lib/controller.js");



const {createServer} = require(`http${enabledHttps !== 'false' ? 's':''}`);

const server = createServer({
  secureProtocol: enabledHttps ? secureProtocol : undefined,
  key: enabledHttps ? readFileSync(path.resolve(__dirname, "./lib/frpc/home.esonwong.com/privkey.pem")) : undefined,
  cert: enabledHttps ? readFileSync(path.resolve(__dirname, "./lib/frpc/home.esonwong.com/fullchain.pem")) : undefined
}, app)

app.use(express.static(path.resolve(__dirname, "./front-end/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/front-end/build/index.html"));
});


let powerEnabled = false, lightEnabled = false;



const wss = new WebSocketServer({ 
  noServer: true, 
  path: "/control",
}, () => {
  console.log("控制 websocket 服务已启动");
});

server.on('upgrade', (request, socket, head) => {
  if (request.url === "/control")
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
});

let cameraCount = 0;
(async () => {
  for (let index = 0; index < 8; index++) {
    if (await existsSync(`/dev/video${index}`)) {
      new Camera({ server, cameraIndex: index });
      cameraCount++
    } else {
      return;
    }
  }
})()

new Microphone({ server });


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
  clients.forEach(
    (socket) => socket.isLogin && socket.sendData(action, payload)
  );
};

if (userList) {
  new User({
    currentUser,
    onChange(user) {
      broadcast("info", { message: `${currentUser ? currentUser.name : ""} 时间到啦，轮到 ${user.name} 啦。` });
      currentUser = user
      password = user.password;
      wss.clients.forEach((ws) => {
        ws.close(0, "时间到了");
      });
    }
  });
}



wss.on("connection", function (socket) {
  console.log("客户端连接！");
  TTS("已建立神经连接，同步率百分之九十");
  console.log("已经设置密码", password ? "是" : "否");
  socket.isLogin = password ? false : true;
  clients.add(socket);
  socket.sendData = sendData;
  socket.sendBinary = sendBinary;
  socket.sendData("controller init", {
    maxSpeed,
    needPassword: password ? true : false,
  });

  socket.sendData("camera count", cameraCount);

  socket.sendData("light enabled", lightEnabled)
  socket.sendData("power enabled", powerEnabled)

  socket.on("close", () => {
    disconnect(socket);
  });

  socket.on('error', (err) => {
    console.log('Received error: ', err);
  });

  socket.on("message", (m) => {
    const { action, payload } = JSON.parse(m);

    // if (action.indexOf("webrtc") !== -1) {
    //   if (!check(socket)) return;
    //   const type = action.split(" ")[1];
    //   switch (type) {
    //     case "connect":
    //       stopWebsocketMedia();
    //       socket.webrtc = new WebRTC({
    //         socket,
    //         onOffer(offer) {
    //           socket.sendData("webrtc offer", offer)
    //         },
    //         onCandidate(candidate) {
    //           socket.sendData("webrtc candidate", candidate)
    //         },
    //         onSuccess() {
    //         },
    //         onClose() {
    //           socket.sendData("webrtc close")
    //           broadcast("stream_active", false);
    //         },
    //         onError({ message }) {
    //           socket.sendData("switch", { protocol: "websocket" });
    //         },
    //         onWarnning({ message }) {
    //           socket.sendData("warn", { status: 1, message });
    //         }
    //       });
    //       break;
    //     case "answer":
    //       socket.webrtc.onAnswer(payload);
    //       break
    //     case "candidate":
    //       socket.webrtc.onCandidate(payload);
    //       break;
    //     case "camera":
    //       socket.webrtc && socket.webrtc.openCamera(payload);
    //       break;
    //     case "close":
    //       socket.webrtc && socket.webrtc.close();
    //       break;
    //     default:
    //       console.log("怎么了？ webrtc", type);
    //       break;
    //   }
    //   return;
    // }

    makeHeartbeatTimer(socket)

    switch (action) {
      case "heartbeat":
        makeHeartbeatTimer(socket);
        break;
      case "ping":
        receivePing(socket, payload);
        break;
      case "login":
        login(socket, payload);
        break;
      // case "open camera":
      //   openCamera(socket, payload);
      //   break;
      case "open light":
        openLight(socket, payload);
        break;
      case "open power":
        openPower(socket, payload);
        break;
      case "speed rate":
        speedRate(socket, payload);
        break;
      case "direction rate":
        directionRate(socket, payload);
        break;
      case "steering rate":
        steeringRate(socket, payload);
        break;
      case "tts":
        speak(socket, payload);
        break;
      case "pi power off":
        if (!check(socket)) break;
        piPowerOff();
        break;
      case "pi reboot":
        if (!check(socket)) break;
        piReboot();
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

/**
 * 接收到 ping 信号时执行
 * @param {WebSocket} socket 
 * @param {object} param1 
 */
const receivePing = (socket, { sendTime }) => {
  socket.sendData("pong", { sendTime });
};

/** 清除、创建心跳超时计时器 */
const makeHeartbeatTimer = (socket) => {
  socket.heartbeatTimeoutId && clearTimeout(socket.heartbeatTimeoutId)
  socket.heartbeatTimeoutId = setTimeout(async () => {
    console.warn("网络连接不稳定，自动刹车")
    speedRate(socket, -currentSpeedRateValue)
    await sleep(200)
    speedRate(socket, 0)
  }, 800)
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

// const openCamera = (socket, v) => {
//   console.log("open camera", v);
//   if (!check(socket)) return;
//   if (v.enabled) {
//     cameraMode = v.cameraMode;
//     startWebsocketMedia();
//   } else {
//     stopWebsocketMedia();
//   }
// };

let currentSpeedRateValue
const speedRate = (socket, v) => {
  console.log("speed", v);
  if (!check(socket)) return;
  if (Math.abs(v) * 100 > maxSpeed) {
    v = v > 0 ? maxSpeed / 100 : -maxSpeed / 100;
  }
  changeSpeed(v);
  broadcast("speed", v);
  currentSpeedRateValue = v
};

const directionRate = (socket, v) => {
  console.log("direction", v);
  if (!check(socket)) return;
  changeDirection(v);
  broadcast("direction", v);
};

const steeringRate = (socket, { index, rate }) => {
  console.log(`steering index: ${index}, rate: ${rate}`);
  if (!check(socket)) return;
  changeSteering(index, rate);
  broadcast("steering", { rate, index });
}

const openLight = (socket, enabled) => {
  if (!check(socket)) return;
  console.log("open light", enabled);
  lightEnabled = enabled;
  changeLight(enabled);
  broadcast("light enabled", enabled);
};

const openPower = (socket, enabled) => {
  if (!check(socket)) return;
  console.log("open power", enabled);
  powerEnabled = enabled;
  changePower(enabled);
  broadcast("power enabled", enabled);
};

const disconnect = (socket) => {
  console.log("客户端断开连接！");
  TTS("神经连接已断开")
  if (socket.webrtc) socket.webrtc.close();
  clearTimeout(socket.timeout);
  clients.delete(socket);
  let num = 0;
  clients.forEach(({ isLogin }) => {
    if (isLogin) num++;
  })
  console.log("已连接客户端", num);
  if (num < 1) {
    closeController();
    lightEnabled = false;
    powerEnabled = false;
  }
};

const speak = async (socket, payload) => {
  if (!check(socket)) return;
  socket.sendData("tts playing", true)
  if (socket.webrtc) socket.webrtc.closeAudioPlayer();
  await TTS(payload.text, payload);
  if (socket.webrtc) socket.webrtc.openAudioPlayer();
  await sleep(3000);
  socket.sendData("tts playing", false);
}

const piPowerOff = () => {
  spawn("halt");
}
const piReboot = () => {
  spawn("reboot");
}

process.on("SIGINT", async function () {
  closeController();
  changeLight(false);
  console.log("Goodbye!");
  await TTS("系统关闭");
  process.exit();
});


server.listen(8080, "0.0.0.0", async (e) => {
  console.log("server", server.address());
  await TTS(`系统初始化完成!本地网络访问地址 ${getIPAdress()}冒号8080`);

  if (frp) {
    if (!frpPort) {
      console.error("启用网络穿透请设置远程端口！ 例如：-f -o 9099");
      process.exit();
    } else {
      process.env.FRP_REMOTE_PORT = frpPort;
      process.env.FRP_SERVER = frpServer;
      process.env.FRP_SERVER_PORT = frpServerPort;
      process.env.FRP_SERVER_TOKEN = frpServerToken;
      require("./lib/frp.js");
    }
  }
});



//获取本机ip地址
function getIPAdress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}

const path = require("path");
const { readFileSync, existsSync, mkdirSync } = require("fs");
if (!existsSync("/var")) {
  mkdirSync("/var");
}
if (!existsSync("/var/tts")) {
  mkdirSync("/var/tts");
}
if (!existsSync("/var/audio")) {
  mkdirSync("/var/audio");
}

const express = require("express");
const { WebSocketServer, secureProtocol } = require("@clusterws/cws");
const app = express();
const package = require("./package.json");
const md5 = require("md5");
const { spawn } = require("child_process");
const User = require("./lib/user");
const TTS = require("./lib/tts");
const Camera = require("./lib/Camera");
const Audio = require("./lib/Audio");
const audioPlayer = require("./lib/AudioPlayer");
const status = require("./lib/status");
const Microphone = require("./lib/Microphone");
const { sleep } = require("./lib/unit");
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
      default: true,
    },
    tsl: {
      describe: "开启 HTTPS",
      type: "boolean",
      default: false,
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
    frpServerUser: {
      default: "",
      describe: "frp 服务器认证 user, user",
      type: "string",
    },
    frpServerToken: {
      default: "eson's network-rc",
      describe: "frp 服务器认证 token, token",
      type: "string",
    },
  })
  .env("NETWORK_RC")
  .help().argv;

console.info("版本", package.version);

const {
  frp,
  frpPort,
  frpServer,
  frpServerPort,
  frpServerToken,
  frpServerUser,
  userList,
  tts,
  tsl,
} = argv;
let { password } = argv;
let currentUser;

status.argv = argv;
status.enabledHttps = tsl;

process.env.TTS = tts;

const {
  changeLight,
  changeDirection,
  changeSpeed,
  closeController,
  changePower,
  changeSteering,
} = require("./lib/controller.js");
const sessionManager = require("./lib/session");

const { createServer } = require(`http${status.enabledHttps ? "s" : ""}`);

const server = createServer(
  {
    secureProtocol: status.enabledHttps ? secureProtocol : undefined,
    key: status.enabledHttps
      ? readFileSync(
          path.resolve(__dirname, `./lib/frpc/${frpServer}/privkey.pem`)
        )
      : undefined,
    cert: status.enabledHttps
      ? readFileSync(
          path.resolve(__dirname, `./lib/frpc/${frpServer}/fullchain.pem`)
        )
      : undefined,
  },
  app
);

app.use(express.static(path.resolve(__dirname, "./front-end/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/front-end/build/index.html"));
});

let powerEnabled = false,
  lightEnabled = false;

const wss = new WebSocketServer(
  {
    noServer: true,
    path: "/control",
  },
  () => {
    console.log("控制 websocket 服务已启动");
  }
);

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/control")
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
});

new Microphone({ server });
new Audio({ server });

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
      broadcast("info", {
        message: `${currentUser ? currentUser.name : ""} 时间到啦，轮到 ${
          user.name
        } 啦。`,
      });
      currentUser = user;
      password = user.password;
      wss.clients.forEach((ws) => {
        ws.close(0, "时间到了");
      });
    },
  });
}

wss.on("connection", async function (socket) {
  console.log("客户端连接！");
  TTS("已建立神经连接，同步率百分之九十五");
  console.log("已经设置密码", password ? "是" : "否");
  socket.isLogin = password ? false : true;
  clients.add(socket);
  socket.sendData = sendData;
  socket.sendBinary = sendBinary;
  socket.sendData("controller init", {
    needPassword: password ? true : false,
  });

  const volume = await audioPlayer.getVolume();
  const sendVolume = function (volume) {
    console.log("音量同步", volume);
    socket.sendData("volume", volume);
  };

  sendVolume(volume);
  audioPlayer.on("volume", sendVolume);

  socket.sendData(
    "camera list",
    cameraList.map(({ name, size }, index) => ({ name, size, index }))
  );

  socket.sendData("light enabled", lightEnabled);

  socket.sendData("power enabled", powerEnabled);

  socket.sendData("config", status.config);

  socket.sendData("info", { message: `Network RC v${package.version}` });

  socket.on("close", () => {
    audioPlayer.removeListener("volume", sendVolume);
    disconnect(socket);
  });

  socket.on("error", (err) => {
    console.log("Received error: ", err);
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

    makeHeartbeatTimer(socket);

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
      case "open light":
        openLight(socket, payload);
        break;
      case "open power":
        openPower(socket, payload);
        break;
      case "speed rate":
        if (status.autoLocking === true) return;
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
        break;
      case "save config":
        if (!check(socket)) break;
        status.saveConfig(payload);
        socket.sendData("success", { message: "设置已保存！" });
        broadcast("config", status.config);
        if (!payload.sharedCode) {
          clients.forEach((socket) => {
            if (socket.session.sharedCode) {
              socket.sendData("error", { message: "分享已关闭！" });
              socket.close();
            }
          });
          status.saveConfig({ sharedEndTime: undefined });
          sessionManager.clearSharedCodeSession();
          broadcast("config", status.config);
        }
        break;
      case "volume":
        if (!check(socket)) break;
        audioPlayer.volume(payload);
        break;
      case "play audio":
        if (!check(socket)) break;
        const { path, stop } = payload;
        if (stop) {
          audioPlayer.stop();
        }
        if (path) {
          audioPlayer.push({ type: "mp3 file path", data: { path } });
        }
        break;
      default:
        console.log("怎么了？");
    }
  });
});

const login = (socket, { sessionId, token, sharedCode }) => {
  if (socket.islogin) {
    socket.sendData("login", { status: 1, message: "已登陆！" });
  }

  if (token) {
    if (md5(password + "eson") == token) {
      socket.isLogin = true;
      const userType = "admin";
      const session = sessionManager.add({ userType });
      socket.session = session;

      socket.sendData("login", {
        session,
        status: 0,
        message: "OMG 你登录啦！",
      });
      return;
    } else {
      socket.sendData("error", { status: 1, message: "哎呦喂，密码错了啊！" });
      return;
    }
  }
  if (status.config.sharedCode && sharedCode) {
    console.log("login shared code", sharedCode);
    if (status.config.sharedCode === sharedCode) {
      socket.isLogin = true;
      const userType = "guest";
      const nowTime = new Date().getTime();
      if (!status.config.sharedEndTime) {
        status.saveConfig({
          sharedEndTime:
            nowTime +
            (status.config.sharedDuration ||
              status.defaultConfig.sharedDuration),
        });
        broadcast("config", status.config);
      }
      const endTime = status.config.sharedEndTime;
      const session = sessionManager.add({ userType, sharedCode, endTime });
      socket.session = session;
      socket.sendData("login", {
        session,
        status: 0,
        message: "🏎️ 分享链接登陆成功 ！",
      });

      socket.endTimerId = setTimeout(() => {
        socket.sendData("error", {
          status: 1,
          message: "时间结束！",
        });
        if (status.config.sharedCode === sharedCode) {
          status.saveConfig({ sharedCode: undefined });
          broadcast("config", status.config);
        }
        socket.close();
      }, endTime - nowTime);

      return;
    } else {
      socket.sendData("error", {
        status: 1,
        message: "哎呦喂，分享链接已失效！",
      });
      return;
    }
  }
  if (sessionId) {
    console.log("login with session", sessionId);
    const session = status.config.sessionList.find((i) => i.id === sessionId);
    if (session) {
      const { sharedCode, endTime, userType } = session;
      if (userType === "guest") {
        const nowTime = new Date().getTime();
        if (nowTime - endTime > 3000) {
          socket.sendData("error", {
            status: 1,
            message: "哎呦喂，登录过期了！",
          });
          if (status.config.sharedCode === sharedCode) {
            status.saveConfig({ sharedCode: undefined });
            broadcast("config", status.config);
          }
          return;
        }

        socket.endTimerId = setTimeout(() => {
          socket.sendData("error", {
            status: 1,
            message: "时间结束！",
          });
          socket.close();
          if (status.config.sharedCode === sharedCode) {
            status.saveConfig({ sharedCode: undefined });
            broadcast("config", status.config);
          }
        }, endTime - nowTime);
      }

      socket.isLogin = true;
      socket.session = session;
      socket.sendData("login", {
        session,
        status: 0,
        message: "已登录！",
      });
      return;
    } else {
      socket.sendData("error", {
        status: 1,
        message: "哎呦喂，登录过期了！",
      });
    }
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
  socket.heartbeatTimeoutId && clearTimeout(socket.heartbeatTimeoutId);
  if (status.autoLocking) {
    status.unlockHearbertCount++;
    if (status.unlockHearbertCount > 5) {
      status.autoLocking = false;
      status.unlockHearbertCount = 0;
      console.info("网络恢复");
      broadcast("success", {
        message: `网络恢复 (￣︶￣)↗  ，解除锁定 !`,
      });
    }
  }
  socket.heartbeatTimeoutId = setTimeout(async () => {
    status.unlockHearbertCount = 0;
    if (status.autoLocking === true) return;
    status.autoLocking = true;
    console.warn("网络连接不稳定，自动刹车");
    broadcast("info", {
      message: `网络连接不稳定，自动刹车, 并锁定`,
    });
    speedRate(socket, -status.currentSpeedRateValue);
    await sleep(200);
    speedRate(socket, 0);
  }, status.config.autoLockTime * 2);
};

const check = (socket) => {
  if (socket.isLogin) {
    return true;
  } else {
    console.error("未登录！");
    socket.sendData("error", { status: 1, message: "未登录！" });
    return false;
  }
};

const speedRate = (socket, v) => {
  const { maxSpeed } = status.config;
  console.log("speed", v);
  if (!check(socket)) return;
  if (Math.abs(v) * 100 > maxSpeed) {
    v = v > 0 ? maxSpeed / 100 : -maxSpeed / 100;
  }
  changeSpeed(v);
  broadcast("speed", v);
  status.currentSpeedRateValue = v;
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
};

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
  TTS("神经连接已断开");
  if (socket.webrtc) socket.webrtc.close();
  if (socket.endTimerId) clearTimeout(socket.endTimerId);
  clearTimeout(socket.timeout);
  clients.delete(socket);
  let num = 0;
  clients.forEach(({ isLogin }) => {
    if (isLogin) num++;
  });
  console.log("已连接客户端", num);
  if (num < 1) {
    closeController();
    lightEnabled = false;
    powerEnabled = false;
  }
};

const speak = async (socket, payload) => {
  if (!check(socket)) return;
  socket.sendData("tts playing", true);
  if (socket.webrtc) socket.webrtc.closeAudioPlayer();
  if (payload.text) {
    await TTS(payload.text, payload);
  }
  if (socket.webrtc) socket.webrtc.openAudioPlayer();
  await sleep(1000);
  socket.sendData("tts playing", false);
};

const piPowerOff = () => {
  spawn("halt");
};
const piReboot = () => {
  spawn("reboot");
};

process.on("SIGINT", async function () {
  closeController();
  changeLight(false);
  console.log("Goodbye!");
  await TTS("系统关闭");
  process.exit();
});

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log(
      "哎哟喂，你已经启动了一个 Network RC， 或者 8080 端口被其他程序使用了..."
    );
  }
});

//获取本机ip地址
function getIPAdress() {
  var interfaces = require("os").networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        return alias.address;
      }
    }
  }
}

let cameraList;
(async () => {
  cameraList = await Camera.getCameraList();
  cameraList.forEach((item, index) => {
    const { dev, size, name, cardType } = item;
    item.server = new Camera({
      server,
      devPath: dev,
      name,
      cardType,
      deviceSize: size,
      cameraIndex: index,
    });
  });

  server.listen(8080, async (e) => {
    console.log("server", server.address());
    await TTS(`系统初始化完成!`);
    console.log(
      `本地访问地址 http${
        status.enabledHttps ? "s" : ""
      }://${getIPAdress()}:8080`
    );
    await TTS(
      `可使用 http${
        status.enabledHttps ? "s" : ""
      }协议访问${getIPAdress()} 8080端口`
    );

    if (frp) {
      if (!frpPort) {
        console.error("启用网络穿透请设置远程端口！ 例如：-f -o 9049");
        process.exit();
      } else {
        process.env.FRP_REMOTE_PORT = frpPort;
        process.env.FRP_SERVER = frpServer;
        process.env.FRP_SERVER_PORT = frpServerPort;
        process.env.FRP_SERVER_TOKEN = frpServerToken;
        process.env.FRP_SERVER_USER = frpServerUser;
        require("./lib/frp.js")({ enabledHttps: status.enabledHttps });
      }
    }
  });
})();

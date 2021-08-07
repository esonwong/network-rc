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

const { WebSocketServer, secureProtocol } = require("@clusterws/cws");
const package = require("./package.json");
const md5 = require("md5");
const { spawn, execSync } = require("child_process");
const app = require("./lib/app");
const TTS = require("./lib/tts");
const Camera = require("./lib/Camera");
const Audio = require("./lib/Audio");
const audioPlayer = require("./lib/AudioPlayer");
const status = require("./lib/status");
const updater = require("./lib/updater");
const Microphone = require("./lib/Microphone");
const { sleep } = require("./lib/unit");
const argv = require("yargs")
  .usage("Usage: $0 [options]")
  .example("$0 -f -o 9058", "开启网络穿透")
  .options({
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
      default: "gz.esonwong.com",
      describe: "frp 服务器, server_addr",
      type: "string",
    },
    frpServerPort: {
      default: 9099,
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
    tslCertPath: {
      type: "string",
    },
    tslKeyPath: {
      type: "string",
    },
  })
  .env("NETWORK_RC")
  .help().argv;

const WebRTC = require("./lib/WebRTC");

console.info(`版本: ${package.version}`);

let {
  frp,
  frpPort,
  frpServer,
  frpServerPort,
  frpServerToken,
  frpServerUser,
  tts,
  tsl,
  tslCertPath,
  tslKeyPath,
} = argv;
let { password } = argv;

status.argv = argv;
status.enabledHttps = tsl;

process.env.TTS = tts;

const sessionManager = require("./lib/session");

sessionManager.clearTimeoutSession();
if (
  status.config.sharedEndTime &&
  status.config.sharedEndTime < new Date().getTime()
) {
  status.saveConfig({ sharedEndTime: undefined });
}

const {
  changePwmPin,
  closeChannel,
  changeSwitchPin,
  channelStatus,
} = require("./lib/channel");

let sharedEndTimerId;

const { createServer } = require(`http${status.enabledHttps ? "s" : ""}`);

if (status.enabledHttps && !tslKeyPath) {
  tslKeyPath = path.resolve(__dirname, `./lib/frpc/${frpServer}/privkey.pem`);
  tslCertPath = path.resolve(
    __dirname,
    `./lib/frpc/${frpServer}/fullchain.pem`
  );
  console.info(`获取 https 证书:${frpServer}`);
  execSync(
    `wget https://network-rc.esonwong.com/download/cert/${frpServer}/privkey.pem -O ${tslKeyPath}`
  );
  execSync(
    `wget https://network-rc.esonwong.com/download/cert/${frpServer}/fullchain.pem -O ${tslCertPath}`
  );
}

let cameraList = [];
const server = createServer(
  {
    secureProtocol: status.enabledHttps ? secureProtocol : undefined,
    key: status.enabledHttps ? readFileSync(tslKeyPath) : undefined,
    cert: status.enabledHttps ? readFileSync(tslCertPath) : undefined,
  },
  app
);

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

wss.on("error", (err) => {
  console.error("Websocket 服务器错误", err);
});

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/control")
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
});

new Microphone({ server });
new Audio({ server });

const clients = new Set();

const broadcast = (action, payload) => {
  clients.forEach(
    (socket) => socket.isLogin && socket.sendData(action, payload)
  );
};

const broadcastConfig = () => {
  const { channelList, uiComponentList, ...other } = status.config;
  broadcast("config", other);
};

status.on("update", () => {
  broadcast("config update");
});

updater.on("downloading", () => {
  broadcast("update-status", "下载中");
});
updater.on("downloaded", () => {
  broadcast("success", { message: "下载完成" });
  broadcast("update-status", "解压中");
});

updater.on("untared", () => {
  broadcast("success", { message: "解压完成" });
});

updater.on("updated", () => {
  broadcast("success", { message: "升级玩完成了！重启中！" });
  broadcast("update-status", "重启中");
});

updater.on("before-restart", () => {
  broadcast("before-restart");
});

updater.on("error", () => {
  broadcast("error", { message: "升级错误" });
});

wss.on("connection", async function (socket) {
  console.log("客户端连接！");
  TTS("已建立神经连接，同步率百分之九十五");
  console.log("已经设置密码", password ? "是" : "否");

  clients.add(socket);

  socket.sendData = function (action, payload) {
    if (
      socket.webrtcChannel &&
      socket.webrtcChannel.controller &&
      socket.webrtcChannel.controller.readyState === "open"
    )
      socket.webrtcChannel.controller.send(JSON.stringify({ action, payload }));
    else this.send(JSON.stringify({ action, payload }));
  };

  const volume = await audioPlayer.getVolume();
  const sendVolume = function (volume) {
    console.log("音量同步", volume);
    socket.sendData("volume", volume);
  };

  sendVolume(volume);
  audioPlayer.on("volume", sendVolume);

  socket.sendData("light enabled", lightEnabled);

  socket.sendData("power enabled", powerEnabled);

  socket.sendData("version", package.version);

  socket.on("close", () => {
    audioPlayer.removeListener("volume", sendVolume);
    disconnect(socket);
  });

  socket.on("error", (err) => {
    console.log("Received error: ", err);
  });

  socket.on("message", (m) => {
    const { action, payload } = JSON.parse(m);

    // console.log("Websocket recived message", action, payload);

    if (action.indexOf("webrtc") !== -1) {
      if (!check(socket)) return;
      const type = action.split(" ")[1];
      switch (type) {
        case "connect":
          socket.webrtc = new WebRTC({
            socket,
            onClose() {
              delete socket.webrtc;
            },
            onDataChannelOpen(channel) {
              if (socket.webrtcChannel) {
                socket.webrtcChannel[channel.label] = channel;
              } else {
                socket.webrtcChannel = {
                  [channel.label]: channel,
                };
              }
              socket.sendData("connect type", "webrtc");
              const camServer = cameraList.find((i) => i.name == channel.label);
              if (camServer) {
                camServer.server.pushRTCDataChannel(channel);
              }
            },
            onDataChannelClose(channel) {
              const camServer = cameraList.find((i) => i.name == channel.label);
              if (camServer) {
                camServer.server.removeRTCDataChannel(channel);
              }
              if (socket.webrtcChannel && socket.webrtcChannel[channel.label]) {
                delete socket.webrtcChannel[channel.label];
              }
            },
            rtcDataChannelList: [
              {
                label: "controller",
                onMessage(data) {
                  const { action, payload } = JSON.parse(data);
                  // if (action !== "heartbeat") {
                  //   console.log("RTC message", action, payload);
                  // }
                  controllerMessageHandle(socket, action, payload, "rtc");
                },
              },
              ...cameraList.map(({ name }) => ({ label: name })),
            ],
            onOffer(offer) {
              socket.sendData("webrtc offer", offer);
            },
            sendCandidate(candidate) {
              socket.sendData("webrtc candidate", candidate);
            },
            onSuccess() {},
            onClose() {
              socket.sendData("webrtc close");
              broadcast("stream_active", false);
              socket.sendData("connect type", "ws");
            },
            onError({ message }) {
              socket.sendData("switch", { protocol: "websocket" });
            },
            onWarnning({ message }) {
              socket.sendData("warn", { status: 1, message });
            },
          });
          break;
        case "answer":
          socket.webrtc.onAnswer(payload);
          break;
        case "candidate":
          socket.webrtc.addCandidate(payload);
          break;
        case "close":
          socket.webrtc && socket.webrtc.close();
          break;
        default:
          console.log("怎么了？ webrtc", type);
          break;
      }
      return;
    }

    controllerMessageHandle(socket, action, payload, "ws");
  });
});

const controllerMessageHandle = (socket, action, payload, type) => {
  switch (action) {
    case "heartbeat":
      makeHeartbeatTimer(socket);
      break;
    case "ping":
      receivePing(socket, { ...payload, type });
      break;
    case "login":
      login(socket, payload);
      if (!check(socket)) break;
      if (socket.isLogin) {
        if (socket.isLogin) {
          socket.sendData(
            "camera list",
            cameraList.map(({ name, size }, index) => ({ name, size, index }))
          );
          broadcastConfig();
          socket.sendData("channel status", channelStatus);
        }
      }
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
      if (!payload.sharedCode) {
        clients.forEach((socket) => {
          if (socket.session && socket.session.sharedCode) {
            socket.close();
            clients.delete(socket);
          }
        });
        status.saveConfig({ sharedEndTime: undefined });
        sessionManager.clearSharedCodeSession();
      }
      broadcastConfig();
      break;

    case "reset config":
      if (!check(socket)) break;
      status.resetConfig();
      socket.sendData("success", { message: "设置已保存！" });
      clients.forEach((socket) => {
        if (socket.session && socket.session.sharedCode) {
          socket.close();
          clients.delete(socket);
        }
      });
      sessionManager.clearSharedCodeSession();
      broadcastConfig();
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
    case "change channel":
      if (!check(socket)) break;
      const channel = status.config.channelList.find(
        (i) => i.pin === payload.pin
      );
      if (channel && channel.enabled) {
        const { pin, value: inputValue } = payload;
        broadcast("channel status", { [pin]: inputValue });
        if (channel.type === "switch") {
          changeSwitchPin(pin, inputValue > 0 ? true : false);
          break;
        }
        const { valueReset, valuePostive, valueNegative } = channel;
        const value =
          inputValue > 0
            ? inputValue * (valuePostive - valueReset) + valueReset
            : inputValue == 0
            ? valueReset
            : inputValue * (valueReset - valueNegative) + valueReset;
        changePwmPin(pin, value);
      }
      break;
    case "reset channel":
      status.resetChannelAndUI();
      broadcastConfig();
      broadcast("success", { message: "通道已重置！！！！！" });
      break;

    case "update":
      broadcast("info", { message: "开始更新" });
      updater.update();
      break;
    default:
      console.log("怎么了？");
  }
};

const login = (socket, { sessionId, token, sharedCode }) => {
  console.log("Login in");
  if (socket.islogin) {
    socket.sendData("login", { status: 1, message: "已登陆！" });
    return;
  }

  if (!password) {
    socket.isLogin = true;
    socket.session = sessionManager.add({
      userType: "admin",
      noPassword: true,
    });
    socket.sendData("login", {
      session: socket.session,
      status: 0,
      message: "OMG 你登录啦！",
    });
    return;
  } else {
    if (!token && !sharedCode && !sessionId) {
      check(socket);
    }
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
          sharedEndTime: nowTime + status.config.sharedDuration,
        });
        broadcastConfig();
      }
      const endTime = status.config.sharedEndTime;
      const session = sessionManager.add({ userType, sharedCode, endTime });
      socket.session = session;
      socket.sendData("login", {
        session,
        status: 0,
        message: "🏎️ 分享链接登陆成功 ！",
      });

      if (!sharedEndTimerId) {
        sharedEndTimerId = setTimeout(() => {
          broadcast("info", { message: "分享时间结束。" });
          status.saveConfig({
            sharedCode: undefined,
            sharedEndTime: undefined,
          });
          broadcast("config", status.config);
          clients.forEach((socket) => {
            if (socket.session.sharedCode) {
              socket.close();
              clients.delete(socket);
            }
          });
          sharedEndTimerId = undefined;
          sessionManager.clearSharedCodeSession();
        }, endTime - nowTime);
      }

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
    const session = sessionManager.list.find((i) => i.id === sessionId);
    if (session) {
      const { noPassword } = session;
      if (password && noPassword) {
        socket.sendData("error", {
          status: 1,
          message: "哎呦喂，登录过期了！",
        });
        return;
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
  if (socket.autoLocking) {
    /** 刹车锁定后 正常心跳统计， 大于 10 就解锁 */
    socket.unlockHearbertCount++;
    console.log("socket.unlockHearbertCount", socket.unlockHearbertCount);
    if (socket.unlockHearbertCount > 10) {
      socket.autoLocking = false;
      socket.unlockHearbertCount = 0;
      console.info("网络恢复");
      socket.sendData("success", {
        message: `网络恢复 (￣︶￣)↗  ，解除锁定 !`,
      });
    }
  }
  socket.heartbeatTimeoutId = setTimeout(async () => {
    socket.unlockHearbertCount = 0;
    console.log("socket.unlockHearbertCount", socket.unlockHearbertCount);
    if (socket.autoLocking === true) return;
    socket.autoLocking = true;
    console.warn("网络连接不稳定，自动刹车");
    socket.sendData("warn", {
      message: `网络连接不稳定，自动刹车, 并锁定`,
    });
    const { channelList = [], specialChannel } = status.config;
    const speedChannel = channelList.find(
      ({ id }) => id === specialChannel.speed
    );
    if (speedChannel) {
      const { pin, valueReset } = speedChannel;
      changePwmPin(pin, -(channelStatus[pin] || valueReset));
      await sleep(200);
      changePwmPin(pin, valueReset);
    }
  }, status.config.autoLockTime * 2);
};

const check = (socket) => {
  if (socket.isLogin) {
    return true;
  } else {
    console.error("未登录！");
    socket.sendData("error", {
      status: 1,
      type: "auth error",
      message: "未登录！",
    });
    return false;
  }
};

const disconnect = (socket) => {
  console.log("客户端断开连接！");
  TTS("神经连接已断开");
  if (socket.webrtc) socket.webrtc.close();
  clearTimeout(socket.timeout);
  clients.delete(socket);
  let num = 0;
  clients.forEach(({ isLogin }) => {
    if (isLogin) num++;
  });
  console.log("已连接客户端", num);
  if (num < 1) {
    closeChannel();
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
  await sleep(800);
  socket.sendData("tts playing", false);
};

const piPowerOff = () => {
  spawn("halt");
};
const piReboot = () => {
  spawn("reboot");
};

process.on("SIGINT", async function () {
  closeChannel();
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

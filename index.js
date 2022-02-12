require("./lib/logger");
const path = require("path");
const { WebSocketServer } = require("@clusterws/cws");
const package = require("./package.json");
const md5 = require("md5");
const { spawn } = require("child_process");
const { defaultFrpc, configFrpc } = require("./lib/frpc");
const app = require("./lib/app");
const TTS = require("./lib/tts");
const CameraServer = require("./lib/CameraServer");
const AudioServer = require("./lib/AudioServer");
const audioPlayer = require("./lib/audioPlayer");
const status = require("./lib/status");
const updater = require("./lib/updater");
const MicrophoneServer = require("./lib/MicrophoneServer");
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
    n: {
      alias: "subDomain",
      describe: "默认 frp 服务的子域名",
      type: "string",
    },
    t: {
      alias: "tts",
      describe: "是否开启语音播报",
      type: "boolean",
      default: true,
    },
    lp: {
      alias: "localPort",
      default: 8080,
      describe: "local server port",
      type: "number",
    },
    f: {
      alias: "frpConfig",
      describe: "frp 配置文件路径",
      type: "string",
    },
  })
  .env("NETWORK_RC")
  .help().argv;

const WebRTC = require("./lib/WebRTC");

console.info(`当前 Network RC 版本: ${package.version}`);

status.argv = argv;

const { subDomain, frpConfig, localPort, password } = argv;

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

const { createServer } = require(`http`);
const { changeLedStatus } = require("./lib/led");

let cameraList = [];
const server = createServer({}, app);

let powerEnabled = false,
  lightEnabled = false;

const wss = new WebSocketServer(
  {
    noServer: true,
    path: "/control",
  },
  () => {
    logger.info("控制 websocket 服务已启动");
  }
);

wss.on("error", (err) => {
  logger.error(`Websocket 服务器错误${err.message}`);
});

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/control")
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
});

new MicrophoneServer({ server });
new AudioServer({ server });

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
  logger.info("客户端连接！");
  TTS("已建立神经连接");
  logger.info("已经设置密码", password ? "是" : "否");

  clients.add(socket);

  changeLedStatus("connected");

  socket.sendData = function (action, payload) {
    if (
      socket.webrtcChannel &&
      socket.webrtcChannel.controller &&
      socket.webrtcChannel.controller.readyState === "open"
    )
      socket.webrtcChannel.controller.send(JSON.stringify({ action, payload }));
    else this.send(JSON.stringify({ action, payload }));
  };

  socket.sendData("light enabled", lightEnabled);

  socket.sendData("power enabled", powerEnabled);

  socket.sendData("version", package.version);

  socket.on("close", () => {
    disconnect(socket);
  });

  socket.on("error", (err) => {
    logger.info("Received error: ", err);
  });

  socket.on("message", (m) => {
    const { action, payload } = JSON.parse(m);

    // logger.info("Websocket recived message", action, payload);

    if (action.indexOf("webrtc") !== -1) {
      if (!check(socket)) return;
      const type = action.split(" ")[1];
      switch (type) {
        case "connect":
          socket.webrtc = new WebRTC({
            socket,
            onClose() {
              delete socket.webrtc;
              TTS("同步率 96%", { stop: true });
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
                  //   logger.info("RTC message", action, payload);
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
            onSuccess() {
              TTS("同步率 98%", { stop: true });
            },
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
          logger.info("怎么了？ webrtc", type);
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
    case "play audio":
      if (!check(socket)) break;
      const { path, stop } = payload;
      audioPlayer.playFile(path, stop);
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

    // case "download cert":
    //   downloadCert()
    //   break;

    default:
      logger.info("怎么了？");
  }
};

const afterLogin = () => {
  TTS("同步率 96%", { stop: true });
};

const login = (socket, { sessionId, token, sharedCode }) => {
  logger.info("Login in");
  if (socket.islogin) {
    socket.sendData("login", { status: 1, message: "已登陆！" });
    afterLogin();
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
    afterLogin();
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
      afterLogin();
      return;
    } else {
      socket.sendData("error", { status: 1, message: "哎呦喂，密码错了啊！" });
      return;
    }
  }

  if (status.config.sharedCode && sharedCode) {
    logger.info("login shared code", sharedCode);
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
      afterLogin();

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
    logger.info("login with session", sessionId);
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
      afterLogin();
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
    if (socket.unlockHearbertCount > 10) {
      socket.autoLocking = false;
      socket.unlockHearbertCount = 0;
      logger.info("网络恢复");
      socket.sendData("locked", false);
    }
  }
  socket.heartbeatTimeoutId = setTimeout(async () => {
    socket.unlockHearbertCount = 0;
    if (socket.autoLocking === true) return;
    socket.autoLocking = true;
    logger.warn("网络连接不稳定，自动刹车");
    socket.sendData("locked", true);
    const { channelList = [], specialChannel } = status.config;
    const speedChannel = channelList.find(
      ({ id }) => id === specialChannel.speed
    );
    if (speedChannel) {
      const { pin, valueReset } = speedChannel;
      if (status.config.autoLockTime) {
        changePwmPin(pin, -(channelStatus[pin] || valueReset));
        await sleep(status.config.autoLockTime);
      }
      changePwmPin(pin, valueReset);
    }
  }, status.config.autoLockTime * 2);
};

const check = (socket) => {
  if (socket.isLogin) {
    return true;
  } else {
    logger.error("未登录！");
    socket.sendData("error", {
      status: 1,
      type: "auth error",
      message: "未登录！",
    });
    return false;
  }
};

const disconnect = (socket) => {
  logger.info("客户端断开连接！");
  TTS("神经连接已断开");
  if (socket.webrtc) socket.webrtc.close();
  clearTimeout(socket.timeout);
  clients.delete(socket);
  let num = 0;
  clients.forEach(({ isLogin }) => {
    if (isLogin) num++;
  });
  logger.info("已连接客户端", num);
  if (num < 1) {
    closeChannel();
    lightEnabled = false;
    powerEnabled = false;
    changeLedStatus("penetrated");
  }
};

const speak = async (socket, payload) => {
  if (!check(socket)) return;
  socket.sendData("tts playing", true);
  if (payload.text) {
    await TTS(payload.text, payload);
  }
  socket.sendData("tts playing", false);
};

const piPowerOff = () => {
  spawn("sudo halt");
};
const piReboot = () => {
  spawn("sudo reboot");
};

server.on("error", (e) => {
  changeLedStatus("error");
  logger.error(`Server error: ${e.message}`);
  if (e.code === "EADDRINUSE") {
    logger.info(` ${localPort} 端口被其他程序使用了...`);
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
  cameraList = await CameraServer.getCameraList();
  cameraList.forEach((item, index) => {
    const { dev, size, name, cardType } = item;
    item.server = new CameraServer({
      server,
      devPath: dev,
      name,
      cardType,
      deviceSize: size,
      cameraIndex: index,
    });
  });

  logger.info(`开始启动服务，端口：${localPort}`);

  server.listen(localPort, async (e) => {
    logger.info("server", server.address());
    await TTS(`系统初始化完成!`);
    logger.info(`本地访问地址 http://${getIPAdress()}:${localPort}`);

    changeLedStatus("running");

    if (subDomain) {
      defaultFrpc(subDomain);
    }

    if (frpConfig) {
      configFrpc(frpConfig);
    }
  });
})();

// process.on("SIGHUP", async function () {
//   process.exit();
// });

async function exitHandler(options, exitCode) {
  if (options.cleanup) {
    logger.info("Exit Clean");
    audioPlayer.destroy();
    changeLedStatus("close");
    await TTS("系统关闭");
    await sleep(1000);
  }
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

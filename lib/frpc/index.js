const { spawn, exec } = require("child_process");
const QRCode = require("qrcode");
const path = require("path");
const TTS = require("../tts");
const status = require("../status");
const { changeLedStatus } = require("../led");

async function configFrpc(configPath) {
  try {
    await TTS("开始网络穿透!").end;
    await TTS("使用配置文件穿透").end;
  } catch (e) {
    logger.info(e);
  }
  const frp = spawn(path.resolve(__dirname, "./frpc"), [
    "-c",
    path.resolve(__dirname, configPath),
  ]);

  frp.on("exit", (code, signal) => {
    logger.error(`frp 退出 code:${code}, ${signal}`);
    changeLedStatus("error");
    if (code !== 0) {
      logger.info(`10秒后再次尝试穿透。`);
      TTS(`穿透失败！10秒后再次尝试穿透。`);
      setTimeout(() => {
        configFrpc(configPath);
      }, 10000);
    }
  });

  frp.stdout.on("data", async (data) => {
    logger.info(`frp stdout ${data}`);

    if (data.indexOf("start proxy success") > -1) {
      changeLedStatus("penetrated");
    }

    if (data.indexOf("network is unreachable") > -1) {
      changeLedStatus("error");
    }
  });

  frp.stderr.on("data", async (data) => {
    logger.error(`frp stderr:${data}`);
  });
}

async function defaultFrpc(subDomain) {
  try {
    await TTS("开始网络穿透!").end;
    await TTS("使用内置 FRP").end;
  } catch (e) {
    logger.info(e);
  }

  const frp = spawn(path.resolve(__dirname, "./frpc"), [
    "-l",
    status.argv.localPort,
    "http",
    "-s",
    "gz.esonwong.com:9099",
    "-t",
    "eson's network-rc",
    "-n",
    subDomain,
    "--sd",
    subDomain,
  ]);

  frp.on("exit", (code, signal) => {
    logger.error(`frp 退出 code:${code}, ${signal}`);
    changeLedStatus("error");
    if (code !== 0) {
      logger.info(`10秒后再次尝试穿透。`);
      TTS(`穿透失败！10秒后再次尝试穿透。`);
      setTimeout(() => {
        defaultFrpc(subDomain);
      }, 10000);
    }
  });

  frp.stdout.on("data", async (data) => {
    logger.info(`frp stdout ${data}`);

    if (data.indexOf("is already in use") > -1) {
      const text = `域名不可用!请更换。`;
      logger.error(text);
      await TTS(text).end;
      process.exit();
    }

    if (data.indexOf("start proxy success") > -1) {
      const url = `https://${subDomain}.nrc.esonwong.com:9000`;
      TTS(
        `穿透成功！使用 HTTPS 协议 ${subDomain}.nrc.esonwong.com 域名、9000 端口进入遥控车控制界面。`,
        { reg: "1" }
      );
      QRCode.toString(url, { type: "terminal" }, function (err, url) {
        console.info(url);
      });
      changeLedStatus("penetrated");
    }
  });

  frp.stderr.on("data", async (data) => {
    logger.info(`frp stderr:${data}`);
  });
}

exports.configFrpc = configFrpc;
exports.defaultFrpc = defaultFrpc;

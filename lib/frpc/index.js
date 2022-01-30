const { spawn, exec } = require("child_process");
const QRCode = require("qrcode");
const path = require("path");
const TTS = require("../tts");
const status = require("../status");

async function configFrpc(configPath) {
  await TTS("开始网络穿透!").end;
  await TTS("使用配置文件穿透").end;
  constfrp = spawn(path.resolve(__dirname, "./frpc"), [
    "-c",
    path.resolve(__dirname, configPath),
  ]);

  frp.on("exit", (code, signal) => {
    console.error("frp 退出", code, signal);
    if (code !== 0) {
      console.log(`10秒后再次尝试穿透。`);
      TTS(`穿透失败！10秒后再次尝试穿透。`);
      setTimeout(() => {
        configFrpc(configPath);
      }, 10000);
    }
  });

  frp.stdout.on("data", async (data) => {
    console.log(`frp stdout ${data}`);
  });

  frp.stderr.on("data", async (data) => {
    console.log(`frp stderr:${data}`);
  });
}

async function defaultFrpc(subDomain) {
  await TTS("开始网络穿透!").end;
  await TTS("使用内置穿透").end;
  const frp = exec(
    `${path.resolve(__dirname, "./frpc")} http -l ${
      status.argv.localPort
    } -s gz.esonwong.com:9099 -t "eson's network-rc" -n ${subDomain} --sd ${subDomain}`
  );

  frp.on("exit", (code, signal) => {
    console.error("frp 退出", code, signal);
    if (code !== 0) {
      console.log(`10秒后再次尝试穿透。`);
      TTS(`穿透失败！10秒后再次尝试穿透。`);
      setTimeout(() => {
        defaultFrpc(subDomain);
      }, 10000);
    }
  });

  frp.stdout.on("data", async (data) => {
    console.log(`frp stdout ${data}`);

    if (data.indexOf("is already in use") > -1) {
      const text = `域名不可用!请更换。`;
      console.error(text);
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
    }
  });

  frp.stderr.on("data", async (data) => {
    console.log(`frp stderr:${data}`);
  });
}

exports.configFrpc = configFrpc;
exports.defaultFrpc = defaultFrpc;

//setInterval(() => {
//  const check = spawn("./lib/frpc/frpc",["status", "-c","./lib/frpc/frpc.ini"])
//  check.stdout.pipe(process.stdout);
//}, 5000)

// frpc http -l 1808 -s gz.esonwong.com:9099 -t "eson's network-rc" --sd nrc

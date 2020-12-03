const spawn = require("child_process").spawn;
const { uuid } = require("uuidv4");
const QRCode = require('qrcode')
const path = require('path');
const TTS = require("./tts");

console.info("启用网络穿透");
console.info(`  穿透服务器:${process.env.FRP_SERVER}:${process.env.FRP_SERVER_PORT}`);
console.info(`  远程端口: ${process.env.FRP_REMOTE_PORT}`);
process.env.FRP_ID = uuid();
let frp
const httpsEnabled = process.env.FRP_SERVER === 'home.esonwong.com'

async function childFrpc() {
  await TTS("开始网络穿透!");
  frp = spawn(path.resolve(__dirname, "./frpc/frpc"), ["-c", path.resolve(__dirname, `./frpc/frpc${httpsEnabled ? "-https": ""}.ini`)]);
  frp.on("exit", (code, signal) => {
    console.error("frp 退出", code, signal);
    if (code !== 0) {
      console.log(`10秒后再次尝试穿透。`);
      TTS(`穿透失败！10秒后再次尝试穿透。`);
      setTimeout(() => {
        childFrpc();
      }, 10000)
    }
  });
  frp.stdout.on("data", async data => {
    console.log(`${data}`);
    if (data.indexOf("start error: port already used") > -1) {
      const text = `${process.env.FRP_REMOTE_PORT} 端口已占用!请更换端口。`;
      console.error(text);
      await TTS(text);
      process.exit();
    }
    if (data.indexOf("port unavailable") > -1) {
      const text = `${process.env.FRP_REMOTE_PORT} 端口不可用!请更换端口。`;
      console.error(text);
      await TTS(text);
      process.exit();
    }
    if (data.indexOf("start proxy success") > -1) {
      const url = `http://${process.env.FRP_SERVER}:${process.env.FRP_REMOTE_PORT}`;
      const text = `穿透成功！使用 ${url}  访问遥控车控制界面`;
      console.info(text);
      TTS(`穿透成功！使用${process.env.FRP_SERVER}端口${process.env.FRP_REMOTE_PORT}访问遥控车控制界面。`, { reg: "1" });
      QRCode.toString(url, { type: 'terminal' }, function (err, url) {
        console.info(url)
      });
      console.info(`如果如果延迟过高，请想办法找一个较近的 frp 服务器来进行网络穿透`);
      console.info(`如果你愿意免费为网友提供 frp 服务器内置到 network-rc 里，请联系我 itiwll@gmail.com`);
    }
  });
}

childFrpc();



//setInterval(() => {
//  const check = spawn("./lib/frpc/frpc",["status", "-c","./lib/frpc/frpc.ini"])
//  check.stdout.pipe(process.stdout);
//}, 5000)

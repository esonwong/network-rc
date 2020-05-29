const xunfeiTTS = require('xf-tts-socket');
const { promisify } = require('util');
const tts = promisify(xunfeiTTS);
const { spawn } = require("child_process");
const { join } = require("path");

const speak = async (text = "一起玩网络遥控车", options = {}) => {
  const { time = 1, reg = "0" } = options;
  const auth = { app_id: '5ecfc626', app_skey: '861669a8b7a57195c3388e8bf276f5a7', app_akey: 'fa6f5ffc31d7bfa3b0392ed75b573c43' };
  const business = { aue: 'raw', vcn: 'aisbabyxu', speed: 80, pitch: 50, auf: "audio/L16;rate=16000", reg };
  const file = join(__dirname, "test.pcm");
  try {
    await tts(auth, business, text, file);
    for (let index = 0; index < time; index++) {
      await play(file);
    }
  } catch (e) {
    console.log('test exception', e);
  }

};

const play = function (file) {
  return new Promise((resolve, reject) => {
    const playerCommand = spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE", file]);
    playerCommand.stdin.on("close", () => {
      console.error(`Audio plyaer stdin close.`);
    });
    playerCommand.stdin.on("finish", () => {
      console.error(`Audio plyaer stdin finish.`);
    });
    playerCommand.stdin.on("error", (e) => {
      console.error(`Audio plyaer error`, e);
      reject();
      // onWarnning && onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    });
    playerCommand.stderr.on('data', (data) => {
      console.error(`Audio plyaer stderr: ${data}`);
      // onError(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    });

    playerCommand.on('exit', (code) => {
      console.log(`Audio plyaer exit, code`, code);
      resolve()
    });
  })
};

module.exports = speak;


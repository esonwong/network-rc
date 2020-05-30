const xunfeiTTS = require('xf-tts-socket');
const { promisify } = require('util');
const tts = promisify(xunfeiTTS);
const { spawn } = require("child_process");
const { join } = require("path");
const { existsSync } = require("fs");
const ffmpeg = require('fluent-ffmpeg');

const speak = async (text = "一起玩网络遥控车", options = {}) => {
  console.log("TTS play", text);

  const { time = 1, reg = "0" } = options;
  const auth = { app_id: '5ecfc626', app_skey: '861669a8b7a57195c3388e8bf276f5a7', app_akey: 'fa6f5ffc31d7bfa3b0392ed75b573c43' };
  const business = { aue: 'raw', vcn: 'aisbabyxu', speed: 50, pitch: 50, auf: "audio/L16;rate=16000", reg };
  const file = join(__dirname, text);
  try {
    if (!existsSync(file + ".wav")) {
      await tts(auth, business, text, file + ".pcm");
      // await ffmpegCommand(file);
    }
    for (let index = 0; index < time; index++) {
      await play(file + ".pcm");
    }
  } catch (e) {
    console.log('test exception', e);
  }

};

let playerCommand;
function closePlayer() {
  if (playerCommand) {
    console.log("TTS plyaer close");
    playerCommand.kill("SIGTERM");
    playerCommand = null;
  }
}

const play = function (file) {
  closePlayer();
  return new Promise((resolve, reject) => {
    const playerCommand = spawn("aplay", ["-c", 1, "-r", 16000, "-f", "S16_LE", file]);
    playerCommand.stdin.on("close", () => {
      console.error(`TTS audio plyaer stdin close.`);
    });
    playerCommand.stdin.on("finish", () => {
      console.error(`TTS audio plyaer stdin finish.`);
    });
    playerCommand.stdin.on("error", (e) => {
      console.error(`TTS audio plyaer stdin error`, e);
      console.log("TTS audio plyaer close");
      closePlayer();
      reject();
      // onWarnning && onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    });
    playerCommand.stderr.on('data', (data) => {
      console.error(`TTS audio plyaer stderr: ${data}`);
      // onError(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    });

    playerCommand.on('exit', (code) => {
      console.log(`TTS audio plyaer exit, code`, code);
      if (code === 0) {
        resolve()
      } else {
        reject()
      }
    });
  })
};

const ffmpegCommand = (file) => {
  return new Promise((resolve, reject) => {

    // ffmpeg(file + ".pcm")
    //   .inputFormat("s16le").audioChannels(1).audioFrequency(16000)
    //   .audioCodec("pcm_s16le")
    //   .output(file + ".wav").audioFrequency(48000)
    //   .on('start', () => {
    //     console.log('TTS ffmpeg start !');
    //   })
    //   .on('error', function (err) {
    //     console.log('TTS ffmpeg err: ' + err.message);
    //     reject();
    //   })
    //   .on('stderr', function (stderrLine) {
    //     console.log('TTS ffmpeg stderr output: ' + stderrLine);
    //   })
    //   .on('end', function () {
    //     console.log('TTS ffmpeg finished !');
    //     resolve();
    //   }).run();
    const ffmpeg = spawn("ffmpeg", ["-f", "s16le", "-ar", 16000, "-ac", 1, "-i", file + ".pcm", "-c:a", "copy", "-ar", 48000, file + ".wav"]);
    ffmpeg.stderr.on('data', (data) => {
      console.error(`TTS ffmpeg stderr: ${data}`);
      // onError(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
      if (data.toString().indexOf("muxing overhead" > -1)) {
        resolve();
      }
    });
    ffmpeg.stdout.on('data', (data) => {
      console.error(`TTS ffmpeg stdout: ${data.toString()}`);
      // onError(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    });
  })
}

module.exports = speak;


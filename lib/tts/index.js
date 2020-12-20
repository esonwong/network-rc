const xunfeiTTS = require('xf-tts-socket');
const { promisify } = require('util');
const tts = promisify(xunfeiTTS);
const { spawn } = require("child_process");
const { join } = require("path");
const { existsSync, mkdirSync } = require("fs");

const tmpPath = '/tmp/tts'
  if(!existsSync('/tmp')){
    mkdirSync('/tmp')
  }
  if(!existsSync('/tmp/tts')){
    mkdirSync(tmpPath)
  }

const speak = async (text = "一起玩网络遥控车", options = {}) => {
  console.log("TTS play", text);

  if (process.env.TTS === "false") {
    console.log("未开启 TTS");
    return;
  };

  const { time = 1, reg = "0" } = options;
  const auth = { app_id: '5ecfc626', app_skey: '861669a8b7a57195c3388e8bf276f5a7', app_akey: 'fa6f5ffc31d7bfa3b0392ed75b573c43' };
  const business = { aue: 'raw', vcn: 'aisbabyxu', speed: 50, pitch: 50, auf: "audio/L16;rate=16000", reg };

  const file = join(tmpPath, text) + ".pcm";
  try {
    if (!existsSync(file)) {
      try {
        await tts(auth, business, text, file);
      } catch (e) {
        throw e;
      }
    }
    for (let index = 0; index < time; index++) {
      await play(file);
    }
  } catch (e) {
    console.log('播放声音错误：', e);
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
    const playerCommand = spawn("aplay", ['-']);
    playerCommand.stdin.on("close", () => {
      // console.error(`TTS audio plyaer stdin close.`);
    });
    playerCommand.stdin.on("finish", () => {
      // console.error(`TTS audio plyaer stdin finish.`);
    });
    playerCommand.stdin.on("error", (e) => {
      console.error(`TTS audio plyaer stdin error`, e);
      // console.log("TTS audio plyaer close");
      closePlayer();
      reject();
      // onWarnning && onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
    });
    playerCommand.stderr.on('data', (data) => {
      console.error(`TTS audio plyaer stderr: ${data}`);
    });

    playerCommand.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject()
      }
    });

    const ffmpeg = openFfmpeg(file)
    ffmpeg.stdout.pipe(playerCommand.stdin)
  })
};


function openFfmpeg(file){
  const ffmpeg = spawn("ffmpeg", [
    "-f",
    "s16le",
    '-ar', 
    16000,
    "-i",
    file,
    '-acodec',
    'pcm_s16le',
    "-f",
    "wav",
    "-"
  ]);

  ffmpeg.stdin.on("error", (e) => {
    console.error(`TTS plyaer ffmpeg stdin error: ${data}`);
  })
  ffmpeg.on('exit', (code) => {
    console.log(`TTS plyaer ffmpeg exit`);
  });

  return ffmpeg
}


module.exports = speak;


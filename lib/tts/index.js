const xunfeiTTS = require('xf-tts-socket');
const { promisify } = require('util');
const tts = promisify(xunfeiTTS);
const { join } = require("path");
const Speaker = require('speaker');
const { existsSync, createReadStream } = require("fs");

const speak = async (text = "一起玩网络遥控车", options = {}) => {
  console.log("TTS play", `"${text}"`);

  if (process.env.TTS === "false") {
    console.log("未开启 TTS");
    return;
  };

  const { time = 1, reg = "0" } = options;
  const auth = { app_id: '5ecfc626', app_skey: '861669a8b7a57195c3388e8bf276f5a7', app_akey: 'fa6f5ffc31d7bfa3b0392ed75b573c43' };
  const business = { aue: 'raw', vcn: 'aisbabyxu', speed: 50, pitch: 50, auf: "audio/L16;rate=16000", reg };
  const file = join(__dirname, text) + ".pcm";
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
    console.error(e)
  }

};


const play = function (file) {
  const speaker = new Speaker({
    channels: 1,          // 2 channels
    bitDepth: 16,         // 16-bit samples
    sampleRate: 16000     // 44,100 Hz sample rate
  });


  
  const stream = createReadStream(file);

  stream.on('error',  error => {
    console.log('TTS file stream error', error.message);
  })
    stream.on('close',  code => {
      console.log('TTS file stream close');
    })

  stream.pipe(speaker)

  


  return new Promise((resolve, reject) => {
    stream.on('close',  code => {
      console.log(`TTS audio plyaer exit, code`, code);
      resolve()
    })
  })
};


module.exports = speak;


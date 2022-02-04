const xunfeiTTS = require("xf-tts-socket");
const { promisify } = require("util");
const { configDir } = require("../unit");
const tts = promisify(xunfeiTTS);
const { join } = require("path");
const { existsSync, mkdirSync } = require("fs");
const audioPlayer = require("../audioPlayer");
const status = require("../status");

if (!existsSync(`${configDir}/tts`)) {
  mkdirSync(`${configDir}/tts`);
}

const speak = async (text = "一起玩网络遥控车", options = {}) => {
  logger.info("TTS play: " + text);

  if (!status.argv.tts) {
    logger.info("未开启 TTS");
    return;
  }

  const { time = 1, reg = "0", stop = false } = options;
  const auth = {
    app_id: "5ecfc626",
    app_skey: "861669a8b7a57195c3388e8bf276f5a7",
    app_akey: "fa6f5ffc31d7bfa3b0392ed75b573c43",
  };
  const business = {
    aue: "lame",
    sfl: 1,
    vcn: "aisbabyxu",
    speed: 50,
    pitch: 50,
    auf: "audio/L16;rate=16000",
    reg,
  };

  const file = join(`${configDir}/tts/`, text) + ".mp3";
  try {
    if (!existsSync(file)) {
      try {
        await tts(auth, business, text, file);
      } catch (e) {
        throw e;
      }
    }
    await audioPlayer.playFile(file, { stop });
  } catch (e) {
    logger.info("播放声音错误：", e);
  }
};

module.exports = speak;

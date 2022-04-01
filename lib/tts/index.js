const { configDir } = require("../unit");
const { join } = require("path");
const { existsSync, mkdirSync } = require("fs");
const audioPlayer = require("../audioPlayer");
const status = require("../status");
const {
  SpeechSynthesizer,
  SpeechConfig,
  AudioConfig,
  SpeechSynthesisOutputFormat,
} = require("microsoft-cognitiveservices-speech-sdk");

const key = "46fb883a118f4f40965f389f418867cf";
const speechConfig = SpeechConfig.fromSubscription(key, "southeastasia");
speechConfig.speechSynthesisOutputFormat =
  SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
speechConfig.speechSynthesisLanguage = "zh-CN";

const tts = (text, filePath) => {
  logger.info(`TTS SDK: ${text} ==> "${filePath}"`);
  const audioConfig = AudioConfig.fromAudioFileOutput(filePath);
  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => {
        logger.info("TTS SDK: success ");
        synthesizer.close();
        resolve();
        return result;
      },
      (error) => {
        logger.error(`TTS Error: ${error.message}`);
        synthesizer.close();
        reject(error);
      }
    );
  });
};

if (!existsSync(`${configDir}/tts`)) {
  mkdirSync(`${configDir}/tts`);
}

const speak = async (text = "一起玩网络遥控车", options = {}) => {
  logger.info("TTS play: " + text);

  if (status.argv && !status.argv.tts) {
    logger.info("未开启 TTS");
    return;
  }

  const { time = 1, reg = "0", stop = false } = options;

  const filePath = join(`${configDir}/tts/`, text) + ".mp3";
  try {
    if (!existsSync(filePath)) {
      try {
        await tts(text, filePath);
      } catch (e) {
        logger.error(`TTS Error: ${e.message}`);
        throw e;
      }
    }
    await audioPlayer.playFile(filePath, { stop });
  } catch (e) {
    logger.info("播放声音错误：", e);
  }
};

speak.tts = tts;
module.exports = speak;

const audioPlayer = require("../lib/audioPlayer");
const speak = require("../lib/tts");

audioPlayer.on("ready", async () => {
  await speak("语音测试");
});

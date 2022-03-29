const audioPlayer = require("../lib/audioPlayer");
const speak = require("../lib/tts");

audioPlayer.on("ready", async () => {
  // await speak.tts("test", "/home/pi/.network-rc/tts/test.mp3");
  // console.log("audioPlayer ready");
  await speak("语音测试");
});

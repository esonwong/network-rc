const audioPlayer = require("../lib/audioPlayer");
const speak = require("../lib/tts");

audioPlayer.on("ready", () => {
  console.log("audioPlayer ready");
  speak("播报测试");
});

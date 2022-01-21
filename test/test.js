const { changePwmPin } = require("../lib/channel");
const audioPlayer = require("../lib/audioPlayer");
const microphone = require("../lib/microphone");

changePwmPin(12, 0.5);
setTimeout(() => {
  changePwmPin(12, 0);
}, 2000);

// audioPlayer.getMicphoneVolume();
// audioPlayer.micphoneVolume(50);

try {
  (async function () {
    await audioPlayer.getSpeakerList();
    const speaker = await audioPlayer.getSpeaker();
    await audioPlayer.setSpeakerVolume(
      speaker.name,
      (Math.random() * 100).toFixed()
    );
    await audioPlayer.getSpeaker();

    await audioPlayer.setSpeaker(speaker.name);
    process.exit();
  })();
} catch (e) {
  console.error(e);
}

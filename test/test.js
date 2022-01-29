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

    await microphone.getMicphoneList();
    const mic = await microphone.getMicphone();
    await microphone.setMicphoneVolume(
      mic.name,
      (Math.random() * 100).toFixed()
    );
    await microphone.getMicphone();
    await microphone.setMicphone(mic.name);

    process.exit();
  })();
} catch (e) {
  console.error(e);
}

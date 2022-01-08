const { changePwmPin } = require("../lib/channel");
const audioPlayer = require("../lib/AudioPlayer");

changePwmPin(12, 0.5);
setTimeout(() => {
  changePwmPin(12, 0);
}, 2000);

audioPlayer.getMicphoneVolume();
audioPlayer.micphoneVolume(50);

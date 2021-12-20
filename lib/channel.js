const { exec } = require("child_process");
const { resolve } = require("path");

const status = {};
const gpio = exec(
  `sudo node ${resolve(__dirname, "./gpio.js")}`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  }
);

// gpio.stdout.on("data", (data) => {
//   console.log(`[GPIO Server Out]`, data);
// });
gpio.stderr.on("data", (data) => {
  console.error(`[GPIO Server Error] ${data}`);
});

exports.changePwmPin = function (pin, v) {
  gpio.stdin.write(`pwm ${pin} ${v}\n`);
};
exports.changeSwitchPin = function (pin, v) {
  gpio.stdin.write(`sw ${pin} ${v}\n`);
};
exports.channelStatus = status;
exports.closeChannel = function () {
  gpio.stdin.write(`close\n`);
};

const { exec } = require("child_process");
const { resolve } = require("path");

const status = {};
let gpioProcess = exec(
  `sudo ${process.execPath} ${resolve(__dirname, "./gpio.js")}`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  }
);

// gpioProcess.stdout.on("data", (data) => {
//   console.log(`[GPIO Server Out]`, data);
// });
gpioProcess.stderr.on("data", (data) => {
  console.error(`[GPIO Server Error] ${data}`);
});

exports.changePwmPin = function (pin, v) {
  gpioProcess.stdin.write(`pwm ${pin} ${v}\n`);
};
exports.changeSwitchPin = function (pin, v) {
  gpioProcess.stdin.write(`sw ${pin} ${v}\n`);
};
exports.channelStatus = status;
exports.closeChannel = function () {
  gpioProcess.stdin.write(`close\n`);
};

process.on("exit", () => {
  gpioProcess.stdin.write(`exit\n`);
});

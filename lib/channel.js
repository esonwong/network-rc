require("../lib/logger");
const { spawn } = require("child_process");
const { resolve } = require("path");

const status = {};
let gpioProcess = spawn(`sudo`, [
  process.execPath,
  resolve(__dirname, "./gpio.js"),
]);

gpioProcess.stdout.on("data", (data) => {
  //   logger.info(`[GPIO Server Out]`, data);
});

gpioProcess.stderr.on("data", (data) => {
  logger.error(`[GPIO Server Error] ${data}`);
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

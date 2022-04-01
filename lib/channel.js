require("../lib/logger");
const { spawn } = require("child_process");
const { resolve } = require("path");

const status = {};
let gpioProcess = spawn(`sudo`, [
  process.execPath,
  resolve(__dirname, "./gpio.js"),
]);

exports.listen = function (pin, callback) {
  gpioProcess.stdin.write(`listen ${pin}\n`);
  gpioProcess.stdout.on("data", (data) => {
    //   logger.info(`[GPIO Server Out]`, data);
    if (data.toString().includes("gpio-change")) {
      const [, json] = data.toString().split("|");
      const { pin, value } = JSON.parse(json);
      if (pin === pin) {
        callback(value);
      }
    }
  });
};

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

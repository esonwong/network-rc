const { exec } = require("child_process");
const { resolve } = require("path");

const status = {};
let gpioProcess = exec(
  `sudo ${process.execPath} ${resolve(__dirname, "./gpio.js")}`,
  (error, stdout, stderr) => {
    if (error) {
      logger.error(`exec error: ${error}`);
      return;
    }
    logger.info(`stdout: ${stdout}`);
    logger.error(`stderr: ${stderr}`);
  }
);

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

const { execSync } = require("child_process");

execSync("echo none | sudo tee /sys/class/leds/led0/trigger");

let timer = null;

const changeActiveLed = (status = 0) => {
  execSync(`echo ${status} | sudo tee /sys/class/leds/led0/brightness`);
};

const changeLedStatus = (type = "running") => {
  timer && clearTimeout(timer);
  let interval = 0;
  let status = 0;
  switch (type) {
    case "running":
      interval = 1000;
      break;
    case "penetrated":
      interval = 500;
      break;
    case "connected":
      interval = 0;
      break;
    case "close":
      changeActiveLed(0);
      return;
    default:
      break;
  }

  if (interval === 0) {
    changeActiveLed(1);
    return;
  }

  timer = setInterval(() => {
    status = status === 0 ? 1 : 0;
    changeActiveLed(status);
  }, interval / 2);
};

exports.changeLedStatus = changeLedStatus;

const pwm = require("rpio-pwm");
const rpio = require("rpio");

let speedPin,
  directionPin,
  speedCh,
  directionCh,
  stepNum = 500;

function initSpeedPin(pin = 13, refresh = 400) {
  const cycleTimeUs = (1000 / refresh) * 1000,
    stepTimeUs = cycleTimeUs / stepNum,
    pwmCfg = {
      cycle_time_us: cycleTimeUs,
      step_time_us: stepTimeUs,
      delay_hw: 0,
    };
  (speedCh = pwm.create_dma_channel(13, pwmCfg)),
    (speedPin = speedCh.create_pwm(pin));
}

function initDirectionPin(pin = 12, refresh = 50) {
  const cycleTimeUs = (1000 / refresh) * 1000,
    stepTimeUs = cycleTimeUs / stepNum,
    pwmCfg = {
      cycle_time_us: cycleTimeUs,
      step_time_us: stepTimeUs,
      delay_hw: 1,
    };
  (directionCh = pwm.create_dma_channel(14, pwmCfg)),
    (directionPin = directionCh.create_pwm(pin));
}

function setRound(pin, round) {
  pin.set_width(round /100 * stepNum);
}

const changeSpeed = function (v) {
  if (v == 0) {
    setRound(speedPin, 60);
  } else {
    setRound(speedPin, 60 + v * 20);
  }
};

const changeDirection = function (v) {
  if (v == 0) {
    setRound(directionPin, 7.5);
  } else {
    setRound(directionPin, v * 2.5 + 7.5);
  }
};

const changeLight = function (enabled) {
  if (enabled) {
    rpio.open(8, rpio.INPUT);
  } else {
    rpio.open(8, rpio.OUTPUT);
  }
  avcServer.broadcast("light enabled", enabled);
};


initSpeedPin();
initDirectionPin();

module.export = {
  changeDirection,changeLight,changeSpeed
}

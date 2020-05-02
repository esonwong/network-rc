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
  (speedCh = pwm.create_dma_channel(pwm.host_is_model_pi4() ? 6 : 13, pwmCfg)),
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
  (directionCh = pwm.create_dma_channel(
    pwm.host_is_model_pi4() ? 7 : 14,
    pwmCfg
  )),
    (directionPin = directionCh.create_pwm(pin));
}

function setRound(pin, round) {
  pin.set_width((round / 100) * stepNum);
}


function changeSpeed(v) {
  if (v == 0) {
    setRound(speedPin, 60);
  } else {
    setRound(speedPin, 60 + v * 20);
  }
};
function changeDirection(v) {
  if (v == 0) {
    setRound(directionPin, 7.5);
  } else {
    setRound(directionPin, v * 2.5 + 7.5);
  }
};
function changeLight(enabled) {
  if (enabled) {
    rpio.open(8, rpio.OUTPUT, rpio.HIGH);
  } else {
    rpio.open(8, rpio.INPUT);
  }
};

function changePower(enabled) {
  if (enabled) {
    rpio.open(7, rpio.OUTPUT);
  } else {
    rpio.open(7, rpio.INPUT);
  }
};

exports.changeSpeed = changeSpeed;
exports.changeDirection = changeDirection;
exports.changeLight = changeLight;
exports.changePower = changePower;
exports.closeController = function () {
  changeSpeed(0);
  changeDirection(0);
  changeLight(false);
  speedCh.shutdown();
  directionCh.shutdown();
};

initSpeedPin();
initDirectionPin();
changeSpeed(0);
changeDirection(0);
changeLight(false);

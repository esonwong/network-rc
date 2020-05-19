const pwm = require("rpio-pwm");
const rpio = require("rpio");

let speedPin,
  directionPin,
  speedCh,
  stepNum = 500,
  steeringPins = [{ pin: 15 }, { pin: 16 }, { pin: 18 }, { pin: 22 }];

const cycleTimeUs = (1000 / 50) * 1000,
  stepTimeUs = cycleTimeUs / stepNum,
  pwmCfg = {
    cycle_time_us: cycleTimeUs,
    step_time_us: stepTimeUs,
    delay_hw: 1,
  };
const directionCh = pwm.create_dma_channel(
  pwm.host_is_model_pi4() ? 7 : 14,
  pwmCfg
);

function initSpeedPin(pin = 13, refresh = 400) {
  const cycleTimeUs = (1000 / refresh) * 1000,
    stepTimeUs = cycleTimeUs / stepNum,
    pwmCfg = {
      cycle_time_us: cycleTimeUs,
      step_time_us: stepTimeUs,
      delay_hw: 0,
    };
  speedCh = pwm.create_dma_channel(pwm.host_is_model_pi4() ? 6 : 13, pwmCfg);
  speedPin = speedCh.create_pwm(pin);
}

function initDirectionPin(pin = 12) {
  directionPin = directionCh.create_pwm(pin);
}

function initSteeringPin(index = 0) {
  steeringPins[index].initedPin = directionCh.create_pwm(steeringPins[index].pin);
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

function changeSteering(index, v) {
  if(!steeringPins[index]) return;
  if (!steeringPins[index].initedPin) {
    initSteeringPin(index);
  }
  if (v == 0) {
    setRound(steeringPins[index].initedPin, 7.5);
  } else {
    setRound(steeringPins[index].initedPin, v * 2.5 + 7.5);
  }
}

function changeLight(enabled) {
  if (enabled) {
    rpio.open(13, rpio.OUTPUT, rpio.LOW);
  } else {
    rpio.open(13, rpio.OUTPUT, rpio.HIGH);
  }
};

function changePower(enabled) {
  if (enabled) {
    rpio.open(11, rpio.OUTPUT, rpio.LOW);
  } else {
    rpio.open(11, rpio.OUTPUT, rpio.HIGH);
  }
};

exports.changeSpeed = changeSpeed;
exports.changeDirection = changeDirection;
exports.changeLight = changeLight;
exports.changePower = changePower;
exports.changeSteering = changeSteering;
exports.closeController = function () {
  changeSpeed(0);
  changeDirection(0);
  changeLight(false);
  speedCh.shutdown();
  directionCh.shutdown();
  rpio.close(11);
  rpio.close(13);
};

initSpeedPin();
initDirectionPin();
changeSpeed(0);
changeDirection(0);
changeLight(false);
changePower(false);

const pwm = require("rpio-pwm");
const rpio = require("rpio");

let speedPin,
  directionPin,
  speedCh,
  directionCh,
  stepNum = 500,
  steeringPins = [{ pin: 22 }, { pin: 23 }, { pin: 24 }, { pin: 25 }]; // pin BCM code

const cycleTimeUs = (1000 / 50) * 1000,
  stepTimeUs = cycleTimeUs / stepNum,
  steeringPWMCfg = {
    cycle_time_us: cycleTimeUs,
    step_time_us: stepTimeUs,
    delay_hw: 1,
  };


const initDirectionCh = () => {
  if (directionCh) return;
  console.log("初始化舵机 PWM 通道");
  directionCh = pwm.create_dma_channel(
    pwm.host_is_model_pi4() ? 7 : 14,
    steeringPWMCfg
  );
}

function initDirectionPin(pin = 12) {  // pin BCM code
  if (!directionCh) {
    initDirectionCh();
  }
  console.log("初始化转向舵机 pin");
  directionPin = directionCh.create_pwm(pin);
}

function initSteeringPin(index = 0) {
  console.log("初始化 舵机 pin", steeringPins[index].pin);
  if (!directionCh) {
    initDirectionCh();
  }
  steeringPins[index].initedPin = directionCh.create_pwm(steeringPins[index].pin);
}

function initSpeedCh(refresh = 400) {  // pin BCM code
  console.log("初始化电调 PWM 通道");
  const cycleTimeUs = (1000 / refresh) * 1000,
    stepTimeUs = cycleTimeUs / stepNum,
    pwmCfg = {
      cycle_time_us: cycleTimeUs,
      step_time_us: stepTimeUs,
      delay_hw: 0,
    };
  speedCh = pwm.create_dma_channel(pwm.host_is_model_pi4() ? 6 : 13, pwmCfg);
}

function initSpeedPin(pin = 13) {
  if (!speedCh) {
    initSpeedCh();
  }
  console.log("初始化电调 pin");
  speedPin = speedCh.create_pwm(pin);
}

function setRound(pin, round) {
  pin.set_width((round / 100) * stepNum);
}


function changeSpeed(v) {
  if (!speedPin) {
    initSpeedPin()
  }
  if (v == 0) {
    setRound(speedPin, 60);
  } else {
    setRound(speedPin, 60 + v * 20);
  }
};
function changeDirection(v) {
  if (!directionPin) {
    initDirectionPin();
  }
  if (v == 0) {
    setRound(directionPin, 7.5);
  } else {
    setRound(directionPin, v * 2.5 + 7.5);
  }
};

function changeSteering(index, v) {
  if (!steeringPins[index]) return;
  if (!steeringPins[index].initedPin) {
    initSteeringPin(index);
  }
  console.log(`GPIO BCM ${steeringPins[index].pin} PWM : ${v}`);
  if (v == 0) {
    setRound(steeringPins[index].initedPin, 7.5);
  } else {
    setRound(steeringPins[index].initedPin, v * 2.5 + 7.5);
  }
}

function changeLight(enabled) {
  const pinBoardCode = 13;
  if (enabled) {
    rpio.open(pinBoardCode, rpio.OUTPUT, rpio.LOW);
  } else {
    rpio.open(pinBoardCode, rpio.OUTPUT, rpio.HIGH);
  }
};

function changePower(enabled) {
  const pinBoardCode = 11;
  if (enabled) {
    rpio.open(pinBoardCode, rpio.OUTPUT, rpio.LOW);
  } else {
    rpio.open(pinBoardCode, rpio.OUTPUT, rpio.HIGH);
  }
};

exports.changeSpeed = changeSpeed;
exports.changeDirection = changeDirection;
exports.changeLight = changeLight;
exports.changePower = changePower;
exports.changeSteering = changeSteering;
exports.openController = function () {
}
exports.closeController = function () {
  console.log("控制关闭！");
  changeDirection(0);
  changeSpeed(0);
  changeDirection(0);
  changeLight(false);
  changePower(false);

  if (directionPin) {
    console.log("关闭舵机 pin");
    directionPin.release();
    directionPin = undefined;
  }
  steeringPins.forEach(i => {
    if (i.initedPin) {
      console.log("关闭 GPIO pin: PCM",i.pin);
      i.initedPin.release();
      i.initedPin = undefined;
    }
  });

  if (speedPin) {
    console.log("关闭电调 pin");
    speedPin.release()
    speedPin = undefined
  }

  rpio.close(11);
  rpio.close(13);
};


changeSpeed(0);
changeDirection(0);
changeLight(false);
changePower(false);

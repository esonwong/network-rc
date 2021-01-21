const pwm = require("rpio-pwm");
const rpio = require("rpio");

let stepNum = 500,
    pwmPinMap = {},
    switchPinList= [],
    pwmCh;

const initPwmCh = (refresh = 50) => {
  if (pwmCh) return;
  console.log("初始化 PWM 通道");
  const cycleTimeUs = (1000 / refresh) * 1000,
    stepTimeUs = cycleTimeUs / stepNum,
    steeringPWMCfg = {
      cycle_time_us: cycleTimeUs,
      step_time_us: stepTimeUs,
      delay_hw: 1,
    };
  pwmCh = pwm.create_dma_channel( pwm.host_is_model_pi4() ? 7 : 14, steeringPWMCfg);
}

function initPin(pinBoardCode = 12) {  
  if (!pwmCh) {
    initPwmCh();
  }
  return pwmCh.create_pwm(pinBoardCode);
}

function setRound(pin, round) {
  pin.set_width((round / 100) * stepNum);
}

function changePwmPin(pin , v) {
  if(!pwmPinMap[pin]){
    pwmPinMap[pin] = initPin(pin);
  }
  if (v == 0) {
    setRound(pwmPinMap[pin], 7.5);
  } else {
    setRound(pwmPinMap[pin], v * 2.5 + 7.5);
  }
};


function changeSwitchPin(pinBoardCode ,enabled) {
  if(!switchPinList.includes(pinBoardCode)){
    switchPinList.push(pinBoardCode)
  }
  if (enabled) {
    rpio.open(pinBoardCode, rpio.OUTPUT, rpio.LOW);
  } else {
    rpio.open(pinBoardCode, rpio.OUTPUT, rpio.HIGH);
  }
};



exports.changePwmPin = changePwmPin;
exports.changeSwitchPin = changeSwitchPin;



exports.closeController = function () {
  Object.keys(pwmPinMap).forEach(pin => {
    changePwmPin(pin, 0)
    pin.release()
  })

  switchPinList.forEach(pin => {
    changeSwitchPin(pin,false)
    rpio.close(pin);
  })
  pwmPinMap = {}
  switchPinList=[]
}
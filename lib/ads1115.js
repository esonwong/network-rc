const ADS1115 = require("ads1115");
const EventEmitter = require("events");
const { sleep } = require("../lib/unit.js");
require("../lib/logger.js");

class Ad extends EventEmitter {
  constructor() {
    super();

    this.voltage = 0;
    this.maxVoltage = 0;

    ADS1115.open(1, 0x49)
      .then(async (ads1115) => {
        ads1115.gain = 1;
        while (true) {
          const voltage = (await ads1115.measure("0+GND")) / 2000;
          if (voltage == 0) continue;
          if (this.voltage != voltage) {
            this.voltage = voltage;
            this.emit("voltage-change", voltage);
            logger.info(`voltage: ${voltage}`);
          }
          await sleep(2000);
        }
      })
      .catch((err) => {
        logger.error("错误" + err.message);
      });
  }
}

module.exports = new Ad();

const rpio = require("rpio");

rpio.i2cBegin();
rpio.i2cSetSlaveAddress(0x48);

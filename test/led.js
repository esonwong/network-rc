const { changeLedStatus } = require("../lib/led");

changeLedStatus("running");

setTimeout(() => {
  changeLedStatus("penetrated");
}, 10000);

setTimeout(() => {
  changeLedStatus("connected");
}, 20000);

setTimeout(() => {
  changeLedStatus("close");
}, 30000);

const { changeLedStatus } = require("../lib/led");

changeLedStatus("running");

setTimeout(() => {
  changeLedStatus("penetrated");
}, 5000);

setTimeout(() => {
  changeLedStatus("connected");
}, 10000);

setTimeout(() => {
  changeLedStatus("error");
}, 15000);

setTimeout(() => {
  changeLedStatus("close");
}, 20000);

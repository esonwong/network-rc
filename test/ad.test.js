const ad = require("../lib/ads1115.js");

ad.on("voltage-change", (voltage) => {
  console.log("voltage-change", voltage);
});

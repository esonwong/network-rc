const { execSync } = require("child_process");
console.info(execSync("pulseaudio --start -D").toString());

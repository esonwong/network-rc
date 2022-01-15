const Camera = require("../lib/Camera.js");

Camera.getCameraList().then(function (cameraList) {
  console.log(cameraList);
});

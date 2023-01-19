const Camera = require("../lib/CameraServer.js")

Camera.getCameraList().then(function (cameraList) {
  console.log(cameraList);
});

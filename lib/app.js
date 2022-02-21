const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
var compression = require("compression");
const status = require("./status");
const audioPlayer = require("./audioPlayer");
const microphone = require("./microphone");
const multer = require("multer");
const upload = multer({ dest: "/home/pi/.network-rc/uploads/" });
const TTS = require("./tts/index");
const { broadcast } = require("../index");

const app = express();
app.use(bodyParser.json());
app.use(compression());

app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  next();
});

app.use(express.static(path.resolve(__dirname, "../front-end/build")));

app.post("/config", (req, res) => {
  status.saveConfig(req.body);
  res.json({ state: "success" });
});

app.post("/api/status-info", (req, res) => {
  logger.info("status info: " + JSON.stringify(req.body));
  broadcast("status info", req.body);
  res.json({ state: "success" });
});

app.get("/config", (req, res) => {
  res.json(status.config);
});

app.post(
  "/api/upload",
  upload.single("file"),
  /**
   * upload file
   * upload file
   * save file to /home/pi/.network-rc/uploads/
   */
  function (req, res) {
    if (!req.file) {
      res.json({ state: "error", message: "no file", file: req.file });
      return;
    }
    res.json({ state: "success", message: "file uploaded" });
  }
);

app.get("/api/speaker", async (req, res) => {
  const list = await audioPlayer.getSpeakerList();
  res.json(list);
});

app
  .get("/api/speaker/current", async (req, res) => {
    const current = await audioPlayer.getSpeaker();
    res.json(current);
  })
  .put("/api/speaker/set", async (req, res) => {
    const { name } = req.body;
    await audioPlayer.setSpeaker(name);
    res.json({ state: "success" });
  })
  .put("/api/speaker/volume", async (req, res) => {
    const { name, volume } = req.body;
    await audioPlayer.setSpeakerVolume(name, volume);
    TTS(`音量`);
    res.json({ state: "success" });
  });

app.get("/api/mic", async (req, res) => {
  const list = await microphone.getMicphoneList();
  res.json(list);
});

app
  .get("/api/mic/current", async (req, res) => {
    const current = await microphone.getMicphone();
    res.json(current);
  })
  .put("/api/mic/set", async (req, res) => {
    const { name } = req.body;
    await microphone.setMicphone(name);
    res.json({ state: "success" });
  })
  .put("/api/mic/volume", async (req, res) => {
    const { name, volume } = req.body;
    await microphone.setMicphoneVolume(name, volume);
    res.json({ state: "success" });
  });

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../front-end/build/index.html"));
});

module.exports = app;

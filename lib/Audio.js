const { WebSocketServer } = require("@clusterws/cws");
const spawn = require("child_process").spawn;

/**
 * 车子的喇叭
 * 播放控制端麦克风拾取的声音
 */
module.exports = class Audio {
  constructor({ server, onWarnning, onError, onSuccess }) {
    this.onWarnning = onWarnning
    this.onError = onError
    this.onSuccess = onSuccess
    const path = `/audio`;
    this.clients = new Set();
    console.log(`Audio player websocker server starting`, path);
    const wss = new WebSocketServer({
      noServer: true,
      path
    }, () => {
      console.log(`Audio player websocker server started`, path);
    });

    server.on('upgrade', (request, socket, head) => {
      if (request.url === path)
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
    });

    this.wss = wss;

    wss.on("connection", (socket) => {
      console.log(`控制端已连接 Audio player`);
      socket.send(JSON.stringify({ action: "ok" }));

      socket.on("message", (m) => {
        const { action, payload } = JSON.parse(m);
        switch (action) {
          case "volume":
            this.volume(payload);
            break;
          default:
        }
      });

      socket.on("close", () => {
        if (wss.clients.length === 0) {
          this.closeAudioPlayer();
        }
      })

      this.openAudioPlayer();

    });

    wss.on("error", err => {
      console.error(err);
    })
  }

  openAudioPlayer() {
    console.log("Audio plyaer open");
    const playerCommand = spawn("aplay", ["-c", 1, "-r", 48000, "-f", "S16_LE"]);
    this.playerCommand = playerCommand;
    playerCommand.stdin.on("close", () => {
      console.error(`Audio plyaer stdin close.`);
    });
    playerCommand.stdin.on("finish", () => {
      console.error(`Audio plyaer stdin finish.`);
    });
    playerCommand.stdin.on("error", (e) => {
      this.onWarnning && this.onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
      this.closeAudioPlayer();
    });
    playerCommand.stderr.on('data', (data) => {
      console.error(`Audio plyaer stderr: ${data}`);
    });

    playerCommand.on('exit', (code) => {
      console.log(`Audio plyaer exit`);
      this.audioSink.removeEventListener(this.onAudioData);
    });
    
    this.audioSink.addEventListener('data', this.onAudioData);
  }

  closeAudioPlayer() {
    if (this.playerCommand) {
      console.log("Audio plyaer close");
      this.playerCommand.kill("SIGTERM");
      this.playerCommand = null;
    }
  }

  onAudioData(data){
    if (!this.playerCommand) return;
    this.playerCommand.stdin.write(Buffer.from(data.samples.buffer))
  }

  volume(v){

  }


}
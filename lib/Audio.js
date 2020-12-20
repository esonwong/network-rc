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

    this.bufferList = []
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

      socket.on("message", (data) => {
        console.log('Audio player data', data)
        this.onAudioData(data)
      });

      socket.on("close", () => {
        if (wss.clients.length === 0) {
          // this.closeAudioPlayer();
        }
      })

      // this.openAudioPlayer();

    });

    wss.on("error", err => {
      console.error(err);
    })
  }

  openAudioPlayer(buffer) {
    console.log("Audio plyaer open");
    const playerCommand = spawn("aplay", ["-c", 1, "-r", 44100, "-f", "S16_LE",'-']);
    playerCommand.stdin.write(buffer)
    this.playerCommand = playerCommand;
    playerCommand.stdin.on("close", () => {
      console.error(`Audio plyaer stdin close.`);
    });
    playerCommand.stdin.on("finish", () => {
      console.error(`Audio plyaer stdin finish.`);
    });
    playerCommand.stdin.on("error", (e) => {
      this.onWarnning && this.onWarnning(new Error("遥控车声音播放错误ヾ(°д°)ノ゛!"))
      // this.closeAudioPlayer();
    });
    playerCommand.stderr.on('data', (data) => {
      console.error(`Audio plyaer stderr: ${data}`);
    });

    playerCommand.on('exit', (code) => {
      console.log(`Audio plyaer exit`);
      this.playerCommand = false
      this.play()
    });

    
  }

  play(){
    if(this.bufferList.length < 1 || this.playerCommand) return;
    const buffer = this.bufferList.shift()
    this.openAudioPlayer(buffer)
  }

  // closeAudioPlayer() {
  //   if (this.playerCommand) {
  //     console.log("Audio plyaer close");
  //     this.playerCommand.kill("SIGTERM");
  //     this.playerCommand = null;
  //   }
  //   if(this.ffmpeg){
  //     this.ffmpeg.kill()
  //   }
  // }

  onAudioData(data){
    const buffer =  Buffer.from(data)
    this.bufferList.push(buffer)

    if(!this.playerCommand){
      this.play()
    }
    
    // if (!this.ffmpeg) {
    //   this.openFfmpeg()
    //   if (!this.playerCommand) return;
    //   this.ffmpeg.stdout.pipe(this.playerCommand.stdin)
    // }
    // this.ffmpeg.stdin.write(buffer)
  }

  volume(v) {

  }

  openFfmpeg(){
    this.ffmpeg = spawn("ffmpeg", [
      "-f",
      "wav",
      "-i",
      "pipe:",
      "-f",
      "wav",
      "-"
    ]);

    this.ffmpeg.stdin.on("error", (data) => {
      console.error(`Audio plyaer ffmpeg stdin error: ${data}`);
    })
    this.ffmpeg.stderr.on('data', (data) => {
      console.error(`Audio plyaer ffmpeg stderr: ${data}`);
    });
    this.ffmpeg.on('exit', (code) => {
      console.log(`Audio plyaer ffmpeg exit`);
    });

    this.ffmpeg.stdout.on('data', function(data){
      console.error(`Audio plyaer ffmpeg stdout: ${data}`);
    });
  }
}
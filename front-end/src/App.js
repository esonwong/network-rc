import React, { Component, createRef, Fragment } from "react";
import store from "store";
import { message, Modal, Button } from "antd";
import "./App.css";
import { Router, navigate } from "@reach/router";
import Controller from "./components/Controller";
import Setting from "./components/Setting";
import { PoweroffOutlined, ReloadOutlined } from "@ant-design/icons";
import Login from "./components/Login";
import md5 from "md5";
import debounce from "debounce";
import Status from "./components/Status";
import localChannelStatus from "./lib/localChannelStatus";
import axios from "axios";
import WebRTC from "./lib/WebRTC";

const pubilcUrl = process.env.PUBLIC_URL;

export default class App extends Component {
  constructor(props) {
    super(props);
    this.appRef = createRef();
    this.state = {
      editabled: false,
      cameraList: [],
      setting: {
        host: window.location.host,
        webrtcEnabled: true,
        ...store.get("setting"),
      },
      serverConfig: {},
      gpioChannelStatus: {},
      wsConnected: false,
      cameraEnabled: false,
      lightEnabled: false,
      powerEnabled: false,
      canvasRef: undefined,
      isAiControlling: false,
      isFullscreen: false,
      localMicrphoneEnabled: true,
      videoSize: 50,
      delay: undefined,
      connectType: "ws",
      action: {
        speed: 0,
        direction: 0,
      },
      ttsPlaying: false,
      isLogin: false,
      volume: 0,
      micVolume: 0,
      session: {},
      version: undefined,
      updateStaus: undefined,
      webrtcChannel: [],
      locaked: false,
    };

    const { changeLight, changePower } = this;

    this.controller = {
      changeLight,
      changePower,
      speed: (v) => {
        const {
          changeSpeed,
          state: { action },
        } = this;
        action.speed = v;
        this.setState({ action: { ...action } });
        changeSpeed(action.speed);
      },
      direction: (v) => {
        const {
          changeDirection,
          state: { action },
        } = this;
        action.direction = v;
        changeDirection(v);
        this.setState({ action: { ...action } });
      },
    };
    this.saveServerConfig = debounce(this._saveServerConfig, 300);
    this.resetChannel = debounce(this._resetChannel, 300);
  }

  componentDidMount() {
    const { connect } = this;
    connect();

    document.body.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement) {
        this.setState({ isFullscreen: true });
      } else {
        this.setState({ isFullscreen: false });
      }
    });
  }

  connect = () => {
    const { host } = this.state.setting;
    let pingTime, heartbeatTime;
    const socket = (this.socket = new WebSocket(
      `${
        window.location.protocol === "https:" ? "wss://" : "ws://"
      }${host}/control`
    ));
    socket.binaryType = "arraybuffer";

    socket.addEventListener("open", () => {
      this.setState({
        wsConnected: true,
        connectType: "ws",
      });
      pingTime = setInterval(() => {
        const sendTime = new Date().getTime();
        this.sendData("ping", { sendTime });
      }, 1000);

      heartbeatTime = setInterval(() => {
        this.sendData("heartbeat");
      }, 200);

      setTimeout(() => this.login(), 200);
    });

    socket.addEventListener("message", async ({ data }) => {
      this.messageHandle(data);
    });

    socket.addEventListener("close", () => {
      clearInterval(pingTime);
      clearInterval(heartbeatTime);
      this.setState({ wsConnected: false });
    });
  };

  messageHandle(data) {
    const { gpioChannelStatus, serverConfig } = this.state;

    if (typeof data === "string") {
      const { action, payload } = JSON.parse(data);
      switch (action) {
        case "connect type":
          this.setState({ connectType: payload });
          break;
        case "version":
          this.setState({ version: payload });
          break;
        case "camera list":
          this.setState({ cameraList: payload });
          break;
        case "login":
          this.onLogin(payload);
          break;
        case "config":
          this.setState({ serverConfig: { ...serverConfig, ...payload } });
          break;
        case "config update":
          this.getServerConfig();
          break;
        case "volume":
          this.setState({ volume: payload });
          break;
        case "micVolume":
          this.setState({ micVolume: payload });
          break;
        case "channel status":
          this.setState({
            gpioChannelStatus: { ...gpioChannelStatus, ...payload },
          });
          break;
        case "tts playing":
          this.setState({ ttsPlaying: payload });
          break;

        case "locked":
          this.setState({ locked: payload });
          break;

        case "update-status":
          this.setState({ updateStaus: payload });
          break;

        case "before-restart":
          setTimeout(() => {
            window.location.reload();
          }, 5000);
          break;
        case "pong":
          this.setState({
            delay: (new Date().getTime() - payload.sendTime) / 2,
          });
          break;
        case "info":
          message.info(payload.message);
          break;
        case "warn":
          message.warn(payload.message);
          break;
        case "error":
          if (payload.type === "auth error") {
            if (window.location.pathname !== "/login") {
              navigate(`${pubilcUrl}/login`);
            }
          }
          message.error(payload.message);
          break;
        case "success":
          message.success(payload.message);
          break;
        default:
          // message.info(`action: ${action}`)
          break;
      }
    }
  }

  sendData(action, payload) {
    if (this.state.wsConnected) {
      if (this?.webrtcChannel?.controller?.readyState === "open") {
        this.webrtcChannel.controller.send(JSON.stringify({ action, payload }));
      } else {
        this.socket.send(JSON.stringify({ action, payload }));
      }
    }
  }

  async getServerConfig() {
    this.setState({ loading: true });
    const { host } = this.state.setting;
    try {
      const { data: serverConfig } = await axios(`//${host}/config`);
      this.setState({ serverConfig });
    } finally {
      this.setState({ loading: false });
    }
  }

  updateVersion = () => {
    this.sendData("update");
  };

  onLogin = ({ message: m = "无密码", session } = {}) => {
    message.success(m);
    this.setState({ isLogin: true, session });
    store.set("network-rc-session", session);
    if (document.referrer.indexOf(window.location.host) > -1) {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(`${pubilcUrl}/controller`, { replace: true });
      }
    } else {
      navigate(`${pubilcUrl}/controller`, { replace: true });
    }

    this.getServerConfig();

    // video 标签
    // const time = setInterval(() => {
    //   if (!this.video.current) return;
    //   clearInterval(time);
    //   this.mediaSource1 = new MediaSource();
    //   const mediaSource = this.mediaSource1;
    //   mediaSource.addEventListener('sourceopen', function (e) { console.log('sourceopen: ' + mediaSource.readyState); });
    //   mediaSource.addEventListener('sourceended', function (e) { console.log('sourceended: ' + mediaSource.readyState); });
    //   mediaSource.addEventListener('sourceclose', function (e) { console.log('sourceclose: ' + mediaSource.readyState); });
    //   mediaSource.addEventListener('error', function (e) { console.log('error: ' + mediaSource.readyState); });
    //   this.video.current.src = window.URL.createObjectURL(this.mediaSource1);
    //   this.mediaSource1.addEventListener("sourceopen", () => {
    //     this.queue1 = [];
    //     // this.sourceBuffer1 = this.mediaSource1.addSourceBuffer('video/mp4; codecs="avc1.640028"');
    //     this.sourceBuffer1 = this.mediaSource1.addSourceBuffer('video/mp4; codecs="mp4a.40.2, avc1.640028"');

    //     // this.video.current.play();
    //     this.sourceBuffer1.addEventListener("updateend", () => {
    //       this.loadPacket();
    //     });
    //     this.changeCamera(true);
    //   })
    // }, 100)
    if (this.state.setting.webrtcEnabled) {
      this.openWebRTC();
    }
  };

  // loadPacket = (data) => {
  //   if (this.sourceBuffer1.updating) {
  //     data && this.queue1.push(data);
  //     return;
  //   }
  //   if (this.queue1.length) {
  //     console.log("queue", this.queue1.length);
  //     const bufferData = this.queue1.shift(); // pop from the beginning
  //     this.sourceBuffer1.appendBuffer(bufferData);
  //     data && this.queue1.push(data);
  //   } else {
  //     data && this.sourceBuffer1.appendBuffer(data);
  //   }
  // }

  openWebRTC() {
    this.webrtc?.close?.();
    if (!this.state.isLogin) return;
    this.webrtc = new WebRTC({
      micphoneEanbled: this.state.localMicrphoneEnabled,
      socket: this.socket,
      onClose() {
        delete this.webrtc;
      },
      onDataChannel: (rtcDataChannel) => {
        const { label } = rtcDataChannel;
        if (this.webrtcChannel) {
          this.webrtcChannel[label] = rtcDataChannel;
        } else {
          this.webrtcChannel = { [label]: rtcDataChannel };
        }
        this.setState({ webrtcChannel: this.webrtcChannel });
        if (rtcDataChannel.label === "controller") {
          this.setState({ locked: false });
          rtcDataChannel.addEventListener("message", ({ data }) =>
            this.messageHandle(data)
          );
        }
      },
      onDataChannelClose: (channel) => {
        if (this.webrtcChannel[channel.label]) {
          delete this.webrtcChannel[channel.label];
          this.setState({ webrtcChannel: this.webrtcChannel });
        }
      },
    });
  }

  playCarMicphonne = (playing) => {
    this.webrtc?.playAudio?.(playing);
  };

  disconnect = (e) => {
    e && e.preventDefault();
    this.setState({ wsConnected: false });
    if (!this.socket) return;
    this.socket.close();
  };

  login = ({ password, sharedCode } = {}) => {
    const session = store.get("network-rc-session") || {};
    this.sendData("login", {
      token: password ? md5(`${password}eson`) : undefined,
      sharedCode,
      sessionId: session.id,
    });
  };

  changeLight = (enable) => {
    const { wsConnected } = this.state;
    if (!wsConnected) return;
    this.sendData("open light", enable);
  };

  changePower = (enable) => {
    const { wsConnected } = this.state;
    if (!wsConnected) return;
    this.sendData("open power", enable);
  };

  piPowerOff = () => {
    const { wsConnected } = this.state;
    if (!wsConnected) return;
    const modal = Modal.warning({
      autoFocusButton: "cancel",
      icon: <PoweroffOutlined />,
      title: "确定要关闭 Pi 酱系统？",
      content: (
        <Fragment>
          <Button
            type="danger"
            icon={<PoweroffOutlined />}
            onClick={() => {
              this.sendData("pi power off");
              modal.destroy();
            }}
          >
            关机
          </Button>
          &nbsp;
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              this.sendData("pi reboot");
              modal.destroy();
            }}
          >
            重启
          </Button>
        </Fragment>
      ),
      maskClosable: true,
      okText: "取消",
    });
  };

  changeEditabled = (editabled) => {
    this.setState({ editabled });
  };

  changeSetting = (setting) => {
    this.setState({ setting });
    store.set("setting", setting);
    navigate(`${pubilcUrl}/controller`);
    window.location.reload();
  };

  changeZeroSpeedRate = (speedZeroRate) => {
    if (!this.state.wsConnected) return;
    this.sendData("speed zero rate", speedZeroRate);
    this.setState({ speedZeroRate });
  };

  changeSpeed = (speedRate) => {
    if (!this.state.wsConnected) return;
    this.sendData("speed rate", speedRate);
  };

  changeDirection = (directionRate) => {
    this.sendData("direction rate", directionRate);
  };

  tts = (text = "一起玩网络遥控车") => {
    this.setState({ ttsPlaying: true });
    this.sendData("tts", { text });
  };

  playAudio = ({ path, stop = true } = {}) => {
    this.sendData("play audio", { path, stop });
  };

  changeVolume = (v) => {
    this.sendData("volume", v);
  };

  changeMicVolume = (v) => {
    this.sendData("micVolume", v);
  };

  changeChannel = (payload) => {
    const { pin, value } = payload;
    localChannelStatus[pin] = value;
    this.sendData("change channel", payload);
  };

  _saveServerConfig = (config) => {
    const {
      setting: { host },
    } = this.state;
    axios.post(`//${host}/config`, config);
  };

  resetServerConfig = () => {
    this.sendData("reset config");
  };

  _resetChannel = () => {
    this.sendData("reset channel");
  };

  render() {
    const {
      connect,
      disconnect,
      controller,
      changeChannel,
      changeSetting,
      changeLight,
      changePower,
      piPowerOff,
      login,
      saveServerConfig,
      resetServerConfig,
      resetChannel,
      changeVolume,
      changeMicVolume,
      changeEditabled,
      updateVersion,
      state: {
        version,
        cameraList,
        setting,
        wsConnected,
        cameraEnabled,
        action,
        isFullscreen,
        serverConfig,
        lightEnabled,
        delay,
        powerEnabled,
        localMicrphoneEnabled,
        isLogin,
        ttsPlaying,
        volume,
        micVolume,
        session,
        editabled,
        gpioChannelStatus,
        updateStaus,
        connectType,
        webrtcChannel,
        locked,
      },
      tts,
      playAudio,
      playCarMicphonne,
    } = this;

    return (
      <div className="App" ref={this.appRef}>
        {!isFullscreen && (
          <Status
            channelStatus={gpioChannelStatus}
            delay={delay}
            connectType={connectType}
            onMicphoneChange={playCarMicphonne}
            locked={locked}
            {...{
              version,
              wsConnected,
              isFullscreen,
              lightEnabled,
              powerEnabled,
              localMicrphoneEnabled,
              changePower,
              changeLight,
              piPowerOff,
              connect,
              disconnect,
              setting,
              isLogin,
              session,
              changeEditabled,
              editabled,
              changeChannel,
              serverConfig,
              updateStaus,
            }}
            disabled={!isLogin}
          />
        )}
        <Router className="app-page">
          <Setting
            path={`${pubilcUrl}/setting`}
            {...setting}
            cameraList={cameraList}
            wsConnected={wsConnected}
            onDisconnect={disconnect}
            onSubmit={changeSetting}
            saveServerConfig={saveServerConfig}
            resetServerConfig={resetServerConfig}
            resetChannel={resetChannel}
            serverConfig={serverConfig}
            changeVolume={changeVolume}
            changeMicVolume={changeMicVolume}
            volume={volume}
            micVolume={micVolume}
            updateVersion={updateVersion}
            updateStaus={updateStaus}
          />
          {wsConnected && (
            <Login path={`${pubilcUrl}/login`} onSubmit={login} />
          )}
          {isLogin ? (
            <>
              <Controller
                session={session}
                path={`${pubilcUrl}/controller`}
                controller={controller}
                lightEnabled={lightEnabled}
                cameraEnabled={cameraEnabled}
                action={action}
                powerEnabled={powerEnabled}
                onTTS={tts}
                playAudio={playAudio}
                ttsPlaying={ttsPlaying}
                setting={setting}
                saveServerConfig={saveServerConfig}
                serverConfig={serverConfig}
                changeChannel={changeChannel}
                editabled={editabled}
                cameraList={cameraList}
                channelStatus={gpioChannelStatus}
                isFullscreen={isFullscreen}
                webrtcChannel={webrtcChannel}
              />
            </>
          ) : undefined}
        </Router>
      </div>
    );
  }
}

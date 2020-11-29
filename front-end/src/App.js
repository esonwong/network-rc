import React, { Component, createRef, Fragment } from "react";
import WakeLock from "react-wakelock-react16";
import store from "store";
import {
  message,
  Modal,
  Button,
} from "antd";
import "./App.css";
import { Router, navigate, Match } from "@reach/router";
import Controller from "./components/Controller";
import Setting from "./components/Setting";
import {
  PoweroffOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import Login from "./components/Login";
import md5 from "md5";
import debounce from "debounce";
import Status from "./components/Status";
import Camera from "./components/Camera";

const pubilcUrl = process.env.PUBLIC_URL;

export default class App extends Component {
  constructor(props) {
    super(props);
    this.appRef = createRef();
    this.playerBoxRef = createRef();
    this.video = createRef();
    this.state = {
      cameraCount: [],
      setting: {
        speedMax: 30,
        wsAddress: window.location.host,
        cameraMode: "default",
        ...store.get("setting"),
      },
      serverSetting: {
        maxSpeed: 100,
      },
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
      action: {
        speed: 0,
        direction: 0,
      },
      ttsPlaying: false,
      isLogin: true
    };

    const { changeLight, changePower, changeSteering } = this;

    this.controller = {
      changeLight,
      changePower,
      changeSteering,
      speed: (v) => {
        const {
          changeSpeed,
          state: {
            setting: { speedMax },
            action,
          },
        } = this;
        action.speed = (v * speedMax) / 100;
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

    this.changeVideoSize = debounce(() => {
      this.setState({ unbounceVideoSize: this.state });
    }, 300);
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
    const { wsAddress } = this.state.setting;
    let pingTime, heartbeatTime;
    const socket = this.socket = new WebSocket(
      `${
      window.location.protocol === "https:" ? "wss://" : "ws://"
      }${wsAddress}/control`
    );
    socket.binaryType = "arraybuffer"

    socket.addEventListener("open", () => {
      this.setState({ wsConnected: true });
      socket.sendData = (action, payload) => {
        socket.send(JSON.stringify({ action, payload }));
      }
      pingTime = setInterval(() => {
        const sendTime = new Date().getTime();
        socket.sendData("ping", { sendTime });
      }, 1000)

      heartbeatTime = setInterval(() => {
        socket.sendData("heartbeat");
      }, 300)
    });

    socket.addEventListener("message", async ({ data }) => {
      if (typeof data === "string") {
        const { action, payload } = JSON.parse(data);
        switch (action) {
          case "controller init":
            this.onInit(payload);
            break;
          case "camera count":
            this.setState({ cameraCount: new Array(payload).fill(1) });
            break;
          case "login":
            this.onLogin(payload);
            break;
          case "light enabled":
            this.setState({ lightEnabled: payload });
            break;
          case "power enabled":
            this.setState({ powerEnabled: payload });
            break;
          case "tts playing":
            this.setState({ ttsPlaying: payload });
            break;
          case "pong":
            this.setState({ delay: (new Date().getTime() - payload.sendTime) / 2 });
            break;
          case "info":
            message.info(payload);
            break;
          case "warn":
            message.warn(payload);
            break;
          case "error":
            message.error(payload);
            break;
          default:
            // message.info(`action: ${action}`)
            break;
        }
      }
    });

    socket.addEventListener("close", () => {
      clearInterval(pingTime);
      clearInterval(heartbeatTime);
      this.setState({ wsConnected: false });
    })
  };

  sendData(action, payload) {
    if (this.socket) {
      this.socket.sendData(action, payload)
    } else {
      console.error("未连接！");
    }
  }

  onInit({ needPassword, maxSpeed }) {
    this.setState({ serverSetting: { maxSpeed, needPassword } });
    if (needPassword) {
      navigate(`${pubilcUrl}/login`);
      this.setState({ isLogin: false })
    } else {
      this.onLogin();
    }
  }

  onLogin = ({ message: m = "无密码" } = {}) => {
    message.success(m);
    this.setState({ isLogin: true })
    navigate(`${pubilcUrl}/`, { replace: true });
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
  }

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


  disconnect = (e) => {
    e && e.preventDefault();
    this.setState({ wsConnected: false });
    if (!this.socket) return;
    this.socket.close();
  };

  login = ({ password }) => {
    const { wsConnected } = this.state;
    if (!wsConnected) return;
    this.socket.sendData("login", {
      token: md5(`${password}eson`),
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
      content: <Fragment>
        <Button type="danger"
          icon={<PoweroffOutlined />}
          onClick={() => { this.sendData("pi power off"); modal.destroy() }}
        >关机</Button>
        &nbsp;
        <Button
          icon={<ReloadOutlined />}
          onClick={() => { this.sendData("pi reboot"); modal.destroy() }}
        >重启</Button>
      </Fragment>,
      maskClosable: true,
      okText: "取消",
    })
  };

  changeSetting = (setting) => {
    this.setState({ setting });
    store.set("setting", setting);
    navigate(`${pubilcUrl}/`);

    // this.connect();
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
    if (!this.state.wsConnected) return;
    this.sendData("direction rate", directionRate);
  };


  changeSteering = (index, rate) => {
    if (!this.state.wsConnected) return;
    this.sendData("steering rate", { index, rate });
  }

  tts = (text = "一起玩网络遥控车") => {
    if (!this.state.wsConnected) return;
    this.setState({ ttsPlaying: true });
    this.sendData("tts", { text });
  }

  render() {
    const {
      connect,
      disconnect,
      controller,
      changeSetting,
      changeLight,
      changePower,
      piPowerOff,
      login,
      state: {
        cameraCount,
        setting,
        wsConnected,
        cameraEnabled,
        action,
        isFullscreen,
        serverSetting,
        lightEnabled,
        videoSize,
        delay,
        powerEnabled,
        localMicrphoneEnabled,
        isLogin,
        ttsPlaying
      },
      tts
    } = this;

    return (
      <div className="App" ref={this.appRef}>
        <Status
          {...{
            wsConnected,
            isFullscreen,
            serverSetting,
            lightEnabled,
            delay,
            powerEnabled,
            localMicrphoneEnabled,
            changePower,
            changeLight,
            piPowerOff,
            connect,
            disconnect,
            setting,
            isLogin
          }}
          videoSize={videoSize}
          onChangeVideoSize={(videoSize) => this.setState({ videoSize })}
          disabled={!isLogin}
        />
        {isLogin &&
          <Match path="/:item">
            {({ match }) => <div
              className="player-box"
              ref={this.playerBoxRef}
              style={{
                // opacity: cameraEnabled ? 1 : 0,
                display: !match || match.uri.indexOf("/ai") > -1 ? "flex" : "none",
                transform: `scale(${videoSize / 50})`,
              }}
            >
              {
                cameraCount.map((_, index) => <Camera key={index} index={index} url={`${setting.wsAddress}/video${index}`} />)
              }
            </div>}
          </Match>
        }
        <Router className="app-page">
          <Setting
            path={`${process.env.PUBLIC_URL}/setting`}
            {...setting}
            serverSetting={serverSetting}
            wsConnected={wsConnected}
            onDisconnect={disconnect}
            onSubmit={changeSetting}
          />
          <Login path={`${process.env.PUBLIC_URL}/login`} onSubmit={login} />
          <Controller
            path={`${process.env.PUBLIC_URL}/*`}
            controller={controller}
            lightEnabled={lightEnabled}
            cameraEnabled={cameraEnabled}
            videoEl={this.video.current}
            action={action}
            powerEnabled={powerEnabled}
            videoSize={videoSize}
            onTTS={tts}
            ttsPlaying={ttsPlaying}
          >
          </Controller>
        </Router>
        <WakeLock preventSleep={wsConnected} />
      </div>
    );
  }
}

import React, { Component, createRef } from "react";
import store from "store";
import {
  InputNumber,
  Form,
  Switch,
  Dropdown,
  Button,
  Popover,
  message,
  Slider,
} from "antd";
import "./App.css";
import Ai from "./Ai";
import { Router, Location, navigate } from "@reach/router";
import Nav from "./components/Nav";
import Controller from "./components/Controller";
import Setting from "./components/Setting";
import WSAvcPlayer from "ws-avc-player";
import {
  HomeOutlined,
  ExpandOutlined,
  CompressOutlined,
  ControlOutlined,
  ApiOutlined,
  DisconnectOutlined,
  VideoCameraOutlined,
  BulbOutlined,
  PlaySquareOutlined,
} from "@ant-design/icons";
import Login from "./components/Login";
import md5 from "md5";
import debounce from "debounce";

const pubilcUrl = process.env.PUBLIC_URL;

export default class App extends Component {
  constructor(props) {
    super(props);
    this.appRef = createRef();
    this.playerBoxRef = createRef();
    this.state = {
      setting: {
        speedMax: 20,
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
      canvasRef: undefined,
      isAiControlling: false,
      isFullscreen: false,
      videoSize: 50,
      action: {
        speed: 0,
        direction: 0,
      },
    };

    const { changeCamera, changeLight } = this;

    this.controller = {
      changeLight,
      changeCamera,
      speed: (v) => {
        const {
          changeSpeed,
          state: {
            setting: { speedMax },
            action,
          },
        } = this;
        // let vAbs = Math.abs(v);
        // if (vAbs > speedMax / 100) {
        //   vAbs = speedMax / 100;
        // }
        // action.speed = v > 0 ? vAbs : -vAbs;
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
    this.wsavc = new WSAvcPlayer({ useWorker: true });

    this.wsavc.on("controller init", ({ needPassword, maxSpeed }) => {
      this.setState({ serverSetting: { maxSpeed, needPassword } });
      if (needPassword) {
        navigate(`${pubilcUrl}/login`);
      }
    });

    this.wsavc.on("disconnected", () => {
      console.log("WS disconnected");
      this.setState({ wsConnected: false, cameraEnabled: false });
    });
    this.wsavc.on("connected", () => {
      console.log("WS connected");
      this.setState({ wsConnected: true });
    });
    this.wsavc.on("frame_shift", (fbl) => {
      // console.log("Stream frame shift: ", fbl);
    });
    this.wsavc.on("resized", (payload) => {
      console.log("resized", payload);
    });
    this.wsavc.on("stream_active", (cameraEnabled) => {
      console.log("Stream is ", cameraEnabled ? "active" : "offline");
      if (cameraEnabled) {
        this.playerBoxRef.current.appendChild(this.wsavc.AvcPlayer.canvas);
      }
      this.setState({ cameraEnabled });
    });

    this.wsavc.on("light enabled", (lightEnabled) => {
      this.setState({ lightEnabled });
    });

    this.wsavc.on("login", ({ message: m }) => {
      message.success(m);
      navigate(`${pubilcUrl}/`);
    });

    this.wsavc.on("error", ({ message: m }) => {
      message.error(m);
    });

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
    this.wsavc.connect(
      `${
        window.location.protocol === "https:" ? "wss://" : "ws://"
      }${wsAddress}`
    );
  };

  disconnect = (e) => {
    e && e.preventDefault();
    this.setState({ wsConnected: false });
    if (!this.wsavc) return;
    this.wsavc.disconnect();
  };

  login = ({ password }) => {
    const { wsConnected } = this.state;
    if (!wsConnected) return;
    this.wsavc.send("login", {
      token: md5(`${password}eson`),
    });
  };

  changeCamera = (enabled) => {
    const {
      state: {
        setting: { cameraMode },
        wsConnected,
      },
    } = this;
    if (!wsConnected) return;
    this.wsavc.send("open camera", { enabled, cameraMode });
  };

  changeLight = (enable) => {
    const { wsConnected } = this.state;
    if (!wsConnected) return;
    this.wsavc.send("open light", enable);
  };

  changeSetting = (setting) => {
    this.setState({ setting });
    store.set("setting", setting);
    navigate(`${pubilcUrl}/`);

    // this.connect();
  };

  changeZeroSpeedRate = (speedZeroRate) => {
    if (!this.state.wsConnected) return;
    this.wsavc.send("speed zero rate", speedZeroRate);
    this.setState({ speedZeroRate });
  };

  changeSpeed = (speedRate) => {
    if (!this.state.wsConnected) return;
    this.wsavc.send("speed rate", speedRate);
  };

  changeDirection = (directionRate) => {
    if (!this.state.wsConnected) return;
    this.wsavc.send("direction rate", directionRate);
  };

  render() {
    const {
      disconnect,
      connect,
      controller,
      changeSetting,
      changeLight,
      changeCamera,
      login,
      state: {
        setting,
        wsConnected,
        cameraEnabled,
        canvasRef,
        action,
        isFullscreen,
        serverSetting,
        lightEnabled,
        videoSize,
      },
    } = this;
    return (
      <div className="App" ref={this.appRef}>
        <Form layout="inline" className="app-status" size="small">
          <Form.Item>
            <Location>
              {({ navigate }) => (
                <Dropdown.Button
                  overlay={Nav}
                  onClick={() => navigate(`${process.env.PUBLIC_URL}/`)}
                  type="primary"
                >
                  <HomeOutlined /> 控制
                </Dropdown.Button>
              )}
            </Location>
          </Form.Item>
          <Form.Item>
            <Switch
              checked={wsConnected}
              onChange={(v) => {
                if (v) connect();
                else disconnect();
              }}
              unCheckedChildren={<DisconnectOutlined />}
              checkedChildren={<ApiOutlined />}
            />
          </Form.Item>
          <Form.Item>
            <Switch
              checked={cameraEnabled}
              onChange={changeCamera}
              checkedChildren={<VideoCameraOutlined />}
              unCheckedChildren={<VideoCameraOutlined />}
            />
          </Form.Item>
          <Form.Item>
            <Switch
              checked={lightEnabled}
              onChange={changeLight}
              checkedChildren={<BulbOutlined />}
              unCheckedChildren={<BulbOutlined />}
            />
          </Form.Item>
          <Form.Item>
            <Button>舵机:{action.direction.toFixed(2)}</Button>
          </Form.Item>
          <Form.Item>
            <Button>电调:{action.speed.toFixed(2)}</Button>
          </Form.Item>
          <Form.Item>
            <Popover
              placement="bottomRight"
              content={
                <Slider
                  step={0.1}
                  tipFormatter={(v) => v * 2}
                  onAfterChange={(videoSize) => this.setState({ videoSize })}
                  style={{ width: "30vw" }}
                />
              }
            >
              <Button>
                <PlaySquareOutlined />
                {videoSize >= 50 ? undefined : "0"}
                {(videoSize * 2).toFixed(1)}%
              </Button>
            </Popover>
          </Form.Item>

          {document.body.requestFullscreen && (
            <Form.Item>
              <Button
                type="primary"
                shape="circle"
                icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => {
                  if (isFullscreen) {
                    document.exitFullscreen();
                  } else {
                    document.body.requestFullscreen();
                  }
                }}
              ></Button>
            </Form.Item>
          )}
        </Form>

        <Router className="app-page">
          <Controller
            path={`${process.env.PUBLIC_URL}/`}
            controller={controller}
            lightEnabled={lightEnabled}
            cameraEnabled={cameraEnabled}
          />
          <Setting
            path={`${process.env.PUBLIC_URL}/setting`}
            {...setting}
            serverSetting={serverSetting}
            wsConnected={wsConnected}
            onDisconnect={disconnect}
            onSubmit={changeSetting}
          />
          <Login path={`${process.env.PUBLIC_URL}/login`} onSubmit={login} />
          <Ai
            path={`${process.env.PUBLIC_URL}/ai`}
            canvasRef={canvasRef}
            action={action}
            controller={controller}
            onAi={(isAiControlling) => this.setState({ isAiControlling })}
          />
        </Router>
        <div
          className="player-box"
          ref={this.playerBoxRef}
          style={{
            display: cameraEnabled ? "flex" : "none",
            transform: `scale(${videoSize / 50})`,
          }}
        ></div>
      </div>
    );
  }
}

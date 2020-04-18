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
} from "@ant-design/icons";
import Login from "./components/Login";
import md5 from "md5";

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
      action: {
        speed: 0,
        direction: 0,
      },
    };

    this.controller = {
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
    if (!this.wsavc) return;
    this.wsavc.send("login", {
      token: md5(`${password}eson`),
    });
  };

  changeCamera = (enabled) => {
    const {
      state: {
        setting: { cameraMode },
      },
    } = this;
    if (!this.wsavc) return;
    this.wsavc.send("open camera", { enabled, cameraMode });
  };

  changeLight = (enable) => {
    if (!this.wsavc) return;
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

  switchContent = () => {
    const {
      changeCamera,
      changeLight,
      state: { lightEnabled, cameraEnabled },
    } = this;
    return (
      <Form>
        <Form.Item label="摄像头">
          <Switch checked={cameraEnabled} onChange={changeCamera} />
        </Form.Item>
        <Form.Item label="车灯">
          <Switch checked={lightEnabled} onChange={changeLight} />
        </Form.Item>
      </Form>
    );
  };

  render() {
    const {
      disconnect,
      connect,
      controller,
      changeSetting,
      switchContent,
      login,
      state: {
        setting,
        wsConnected,
        cameraEnabled,
        canvasRef,
        action,
        isFullscreen,
        serverSetting
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
                  onClick={() => navigate("/")}
                  type="primary"
                >
                  <HomeOutlined /> 控制
                </Dropdown.Button>
              )}
            </Location>
          </Form.Item>
          <Form.Item label="连接">
            <Switch
              checked={wsConnected}
              onChange={(v) => {
                if (v) connect();
                else disconnect();
              }}
            />
          </Form.Item>
          <Form.Item>
            <Popover content={switchContent} title="开关" trigger="click">
              <Button icon={<ControlOutlined />}>开关</Button>
            </Popover>
          </Form.Item>

          <Form.Item label="舵机">
            <InputNumber value={action.direction} />
          </Form.Item>
          <Form.Item label="电调">
            <InputNumber value={action.speed} />
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
          style={{ display: cameraEnabled ? "flex" : "none" }}
        ></div>
      </div>
    );
  }
}

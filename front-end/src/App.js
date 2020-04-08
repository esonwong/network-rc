import React, { Component, createRef } from "react";
import store from "store";
import { InputNumber, Form, Switch, Dropdown } from "antd";
import "./App.css";
import Ai from "./Ai";
import { Router, Location } from "@reach/router";
import Nav from "./components/Nav";
import Controller from "./components/Controller";
import Setting from "./components/Setting";
import WSAvcPlayer from "ws-avc-player";
import { HomeOutlined } from "@ant-design/icons";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.appRef = createRef();
    this.playerBoxRef = createRef();
    this.state = {
      setting: {
        speedMax: 20,
        wsAddress: window.location.host,
        ...store.get("setting"),
      },
      wsConnected: false,
      cameraEnabled: false,
      canvasRef: undefined,
      isAiControlling: false,
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
    connect();
  }

  connect = () => {
    const { wsAddress } = this.state.setting;
    this.wsavc.connect(
      `${
        window.location.protocol === "https:" ? "wss://" : "ws://"
      }${wsAddress}`
    );
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
  };

  disconnect = (e) => {
    e && e.preventDefault();
    this.setState({ wsConnected: false });
    if (!this.wsavc) return;
    this.wsavc.disconnect();
  };

  changeCamera = (enable) => {
    if (!this.wsavc) return;
    this.wsavc.send("open camera", enable);
  };

  changeSetting = (setting) => {
    this.setState({ setting });
    store.set("setting", setting);
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
      changeCamera,
      state: { setting, wsConnected, cameraEnabled, canvasRef, action },
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
          <Form.Item label="连接状态">
            <Switch
              checked={wsConnected}
              onChange={(v) => {
                if (v) connect();
                else disconnect();
              }}
            />
          </Form.Item>
          <Form.Item label="摄像头">
            <Switch checked={cameraEnabled} onChange={changeCamera} />
          </Form.Item>

          <Form.Item label="舵机">
            <InputNumber value={action.direction} />
          </Form.Item>
          <Form.Item label="电调">
            <InputNumber value={action.speed} />
          </Form.Item>

          {/* <Form.Item label="全屏">
            <Button
              type="primary"
              shape="circle"
              icon={<ExpandOutlined />}
              onClick={() => {
                const el = this.appRef.current;
                el.requestFullscreen && el.requestFullscreen();
              }}
            ></Button>
          </Form.Item> */}
        </Form>

        <Router className="app-page">
          <Controller path="/" controller={controller} />
          <Setting
            path="setting"
            {...setting}
            wsConnected={wsConnected}
            onDisconnect={disconnect}
            onSubmit={changeSetting}
          />
          <Ai
            path="ai"
            canvasRef={canvasRef}
            action={action}
            controller={controller}
            onAi={(isAiControlling) => this.setState({ isAiControlling })}
          />
        </Router>
        <div
          className="player-box"
          ref={this.playerBoxRef}
          style={{ display: cameraEnabled ? "flex" : "hidden" }}
        ></div>
      </div>
    );
  }
}

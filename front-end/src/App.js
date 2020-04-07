import React, { Component, createRef } from "react";
import store from "store";
import { InputNumber, Form, Switch, Button } from "antd";
import "./App.css";
import Ai from "./Ai";
import { Router, Link } from "@reach/router";
// import Nav from "./components/Nav";
import Controller from "./components/Controller";
import Setting from "./components/Setting";
import { SettingOutlined } from "@ant-design/icons";
import WSAvcPlayer from "ws-avc-player";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.appRef = createRef();
    this.playerBoxRef = createRef();
    this.state = {
      setting: {
        speedMaxRate: store.get("speedMaxRate") || 80,
        speedReverseMaxRate: store.get("speedReverseMaxRate") || 70,
        speedZeroRate: store.get("speedZeroRate") || 75,
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
            setting: { speedMaxRate, speedReverseMaxRate, speedZeroRate },
            action,
          },
        } = this;
        action.speed = v;
        const rate =
          v > 0
            ? speedZeroRate + (speedMaxRate - speedZeroRate) * v
            : speedZeroRate + (speedZeroRate - speedReverseMaxRate) * v;
        this.setState({ action: { ...action } });
        changeSpeed(rate);
      },
      direction: (v) => {
        const {
          changeDirection,
          state: { action },
        } = this;
        action.direction = v;
        changeDirection(v * 5 + 7.5);
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
    this.wsavc.connect("ws://10.0.6:8080");
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
    this.connect();
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
          <Form.Item label="连接状态">
            <Switch
              checked={wsConnected}
              onChange={(v) => {
                if (v) connect();
                else disconnect();
              }}
            />
          </Form.Item>

          <Form.Item label="舵机">
            <InputNumber value={action.direction} />
          </Form.Item>
          <Form.Item label="电调">
            <InputNumber value={action.speed} />
          </Form.Item>
          <Form.Item label="摄像头">
            <Switch checked={cameraEnabled} onChange={changeCamera} />
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

          <Form.Item label="设置">
            <Link to="setting">
              <Button
                type="primary"
                shape="circle"
                icon={<SettingOutlined />}
              />
            </Link>
          </Form.Item>
        </Form>

        {/* <Nav className="app-nav" /> */}

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
        <div className="player-box" ref={this.playerBoxRef}></div>
      </div>
    );
  }
}

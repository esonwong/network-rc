import React, { Component } from "react";
import store from "store";

import { InputNumber, Form, Switch, Button } from "antd";
import Keyboard from "./Keyboard";
import "./App.css";
import Player from "./Player";
import Ai from "./Ai";
import { Router } from "@reach/router";
import Nav from "./components/Nav";
import Controller from "./components/Controller";
import Setting from "./components/Setting";
import { ExpandOutlined } from "@ant-design/icons";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.appRef = React.createRef();
    this.state = {
      setting: {
        speedMaxRate: store.get("speedMaxRate") || 80,
        speedReverseMaxRate: store.get("speedReverseMaxRate") || 70,
        speedZeroRate: store.get("speedZeroRate") || 75,
        wsAddress: store.get("wsAddress"),
        playerWsAddress: store.get("playerWsAddress"),
        ...store.get("setting"),
      },
      wsConnected: false,
      playerEnabled: false,
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
    const {
      connectWs,
      state: { wsAddress },
    } = this;

    connectWs({ wsAddress });
  }

  connectWs = ({ wsAddress, playerWsAddress }) => {
    if (!wsAddress) return;
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }

    this.socket = window.io(wsAddress);
    this.socket.on("connect", () => {
      this.setState({ wsConnected: true });
      this.changeZeroSpeedRate(this.state.speedZeroRate);
      store.set("wsAddress", wsAddress);
    });
    this.socket.on("disconnect", () => {
      this.setState({ wsConnected: false });
    });

    if (!playerWsAddress) return;
    this.setState({
      playerWsAddress,
    });
    store.set("playerWsAddress", playerWsAddress);
  };

  disconnectWs = (e) => {
    e && e.preventDefault();
    this.socket.close();
  };

  changeSetting = (setting) => {
    this.setState({ setting });
    store.set("setting", setting);
    this.connectWs(setting);
  };

  changeZeroSpeedRate = (speedZeroRate) => {
    if (!this.state.wsConnected) return;
    this.socket.emit("speed zero rate", speedZeroRate);
    this.setState({ speedZeroRate });
  };

  changeSpeed = (speedRate) => {
    if (!this.state.wsConnected) return;
    this.socket.emit("speed rate", speedRate);
  };

  changeDirection = (directionRate) => {
    if (!this.state.wsConnected) return;
    this.socket.emit("direction rate", directionRate);
  };

  render() {
    const {
      disconnectWs,
      controller,
      changeSetting,
      state: { setting, wsConnected, playerEnabled, canvasRef, action },
    } = this;
    return (
      <div className="App" ref={this.appRef}>
        <Form layout="inline" className="app-status" size="small">
          <Form.Item label="连接状态">
            <Switch checked={wsConnected} disabled />
          </Form.Item>

          <Form.Item label="舵机">
            <InputNumber value={action.direction} />
          </Form.Item>
          <Form.Item label="电调">
            <InputNumber value={action.speed} />
          </Form.Item>
          <Form.Item label="摄像头">
            <Switch
              checked={playerEnabled}
              onChange={(playerEnabled) => {
                this.setState({ playerEnabled });
              }}
            />
          </Form.Item>
          <Form.Item label="全屏">
            <Button
              type="primary"
              shape="circle"
              icon={<ExpandOutlined />}
              onClick={() => {
                const el = this.appRef.current;
                el.requestFullscreen && el.requestFullscreen();
              }}
            ></Button>
          </Form.Item>
        </Form>

        <Nav className="app-nav" />

        <Router className="app-page">
          <Controller path="controller" controller={controller} />
          <Setting
            path="setting"
            {...setting}
            wsConnected={wsConnected}
            onDisconnect={disconnectWs}
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

        <Player
          disabled={!playerEnabled}
          address={setting.playerWsAddress}
          setCanvasRef={(canvasRef) => {
            this.setState({ canvasRef });
          }}
        />
        <Keyboard controller={controller} />
      </div>
    );
  }
}
